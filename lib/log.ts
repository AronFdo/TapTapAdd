import { z } from "zod";

/**
 * Structured logging that only accepts allow-listed fields, so CV text,
 * extracted profiles and raw AI responses can't be logged by accident.
 * Add a field here only if it can never contain personal content.
 */
const LogFieldsSchema = z
  .object({
    route: z.string().max(200),
    userId: z.uuid(),
    siteId: z.uuid(),
    versionId: z.uuid(),
    task: z.string().max(64),
    model: z.string().max(64),
    mode: z.enum(["live", "record", "replay"]),
    status: z.number().int(),
    durationMs: z.number().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    attempt: z.number().int().nonnegative(),
    errorCode: z.string().max(64),
  })
  .partial();

export type LogFields = z.infer<typeof LogFieldsSchema>;

type Level = "info" | "warn" | "error";

function write(level: Level, event: string, fields: LogFields = {}) {
  const parsed = LogFieldsSchema.strip().safeParse(fields);
  const safe = parsed.success ? parsed.data : { errorCode: "log_fields_invalid" };
  const line = JSON.stringify({ level, event, ...safe, at: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
