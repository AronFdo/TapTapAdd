import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/**
 * Recorded AI responses for tests. Only ever recorded from the anonymised
 * fixtures in tests/fixtures, never from real users.
 */
const RecordingSchema = z.object({
  key: z.string(),
  task: z.string(),
  model: z.string(),
  output: z.unknown(),
});

export type Recording = z.infer<typeof RecordingSchema>;

export const RECORDINGS_DIR = path.join(process.cwd(), "tests", "fixtures", "ai");

export class MissingRecordingError extends Error {
  constructor(task: string, key: string) {
    super(
      `No recorded response for task "${task}" (key ${key}). ` +
        "Run the test with AI_MODE=record and an API key to record it.",
    );
    this.name = "MissingRecordingError";
  }
}

/** Sorts object keys so equal requests always hash to the same key. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function recordingKey(request: unknown): string {
  return createHash("sha256").update(stableStringify(request)).digest("hex").slice(0, 16);
}

function fileFor(task: string, key: string, dir: string) {
  return path.join(dir, task, `${key}.json`);
}

export async function readRecording(
  task: string,
  key: string,
  dir = RECORDINGS_DIR,
): Promise<Recording> {
  let raw: string;
  try {
    raw = await readFile(fileFor(task, key, dir), "utf8");
  } catch {
    throw new MissingRecordingError(task, key);
  }
  return RecordingSchema.parse(JSON.parse(raw));
}

export async function writeRecording(recording: Recording, dir = RECORDINGS_DIR) {
  const file = fileFor(recording.task, recording.key, dir);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(recording, null, 2)}\n`);
}
