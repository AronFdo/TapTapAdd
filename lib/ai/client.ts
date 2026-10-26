import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { log } from "@/lib/log";
import { TASKS, modelFor, type AiTask } from "./models";
import { readRecording, recordingKey, writeRecording } from "./recordings";

export class AiRefusalError extends Error {
  constructor(task: AiTask) {
    super(`The model declined the ${task} request.`);
    this.name = "AiRefusalError";
  }
}

export class AiTruncatedError extends Error {
  constructor(task: AiTask) {
    super(`The ${task} response hit its token limit before finishing.`);
    this.name = "AiTruncatedError";
  }
}

export type JsonRequest<S extends z.ZodType> = {
  task: AiTask;
  system: string;
  prompt: string;
  schema: S;
};

export type JsonResult<S extends z.ZodType> =
  | { ok: true; data: z.infer<S>; raw: unknown }
  | { ok: false; issues: z.core.$ZodIssue[]; raw: unknown };

let client: Anthropic | undefined;

function anthropic(): Anthropic {
  client ??= new Anthropic({ apiKey: serverEnv().ANTHROPIC_API_KEY });
  return client;
}

async function callModel(task: AiTask, system: string, prompt: string, jsonSchema: unknown) {
  const config = TASKS[task];
  const model = modelFor(task);
  const started = Date.now();

  const response = await anthropic().beta.messages.create({
    model,
    max_tokens: config.maxTokens,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt }],
    output_config: {
      effort: config.effort,
      format: { type: "json_schema", schema: jsonSchema as Record<string, unknown> },
    },
    // On a policy decline, the API retries on a suitable fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  log.info("ai.call", {
    task,
    model,
    mode: serverEnv().AI_MODE,
    durationMs: Date.now() - started,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  if (response.stop_reason === "refusal") throw new AiRefusalError(task);
  if (response.stop_reason === "max_tokens") throw new AiTruncatedError(task);

  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
  return JSON.parse(text) as unknown;
}

/**
 * Asks the model for JSON matching `schema` and validates it. Returns the
 * validation issues instead of throwing so callers can retry with them.
 *
 * AI_MODE=replay answers from recorded fixtures only; AI_MODE=record calls
 * the API and saves the response as a fixture.
 */
export async function generateJson<S extends z.ZodType>(
  request: JsonRequest<S>,
): Promise<JsonResult<S>> {
  const { task, system, prompt, schema } = request;
  const jsonSchema = z.toJSONSchema(schema, { target: "draft-2020-12", io: "output" });
  const model = modelFor(task);
  const key = recordingKey({ task, model, system, prompt, schema: jsonSchema });
  const mode = serverEnv().AI_MODE;

  let raw: unknown;
  if (mode === "replay") {
    raw = (await readRecording(task, key)).output;
  } else {
    raw = await callModel(task, system, prompt, jsonSchema);
    if (mode === "record") await writeRecording({ key, task, model, output: raw });
  }

  const parsed = schema.safeParse(raw);
  return parsed.success
    ? { ok: true, data: parsed.data, raw }
    : { ok: false, issues: parsed.error.issues, raw };
}
