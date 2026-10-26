import { afterEach, describe, expect, it, vi } from "vitest";
import { log, type LogFields } from "./log";

describe("log", () => {
  afterEach(() => vi.restoreAllMocks());

  function capture() {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    return () => JSON.parse(String(spy.mock.calls[0]?.[0])) as Record<string, unknown>;
  }

  it("writes allow-listed fields", () => {
    const read = capture();
    log.info("ai.call", { task: "extract", durationMs: 1200 });
    expect(read()).toMatchObject({ level: "info", event: "ai.call", task: "extract", durationMs: 1200 });
  });

  it("drops fields that aren't allow-listed, even when the type is bypassed", () => {
    const read = capture();
    const sneaky = { task: "extract", cvText: "Jane Perera, 123 Galle Road" } as LogFields;
    log.info("ai.call", sneaky);
    const line = read();
    expect(line).not.toHaveProperty("cvText");
    expect(JSON.stringify(line)).not.toContain("Galle Road");
  });

  it("replaces invalid values instead of writing them", () => {
    const read = capture();
    log.info("ai.call", { task: "x".repeat(500) });
    expect(read()).toMatchObject({ errorCode: "log_fields_invalid" });
  });
});
