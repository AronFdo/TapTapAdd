import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MissingRecordingError, readRecording, recordingKey, writeRecording } from "./recordings";

describe("recordingKey", () => {
  it("ignores object key order", () => {
    expect(recordingKey({ a: 1, b: { c: 2, d: 3 } })).toBe(recordingKey({ b: { d: 3, c: 2 }, a: 1 }));
  });

  it("changes when any part of the request changes", () => {
    expect(recordingKey({ prompt: "a" })).not.toBe(recordingKey({ prompt: "b" }));
  });
});

describe("recordings on disk", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "recordings-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("round-trips a recording", async () => {
    const recording = { key: "abc", task: "extract", model: "m", output: { name: "Test" } };
    await writeRecording(recording, dir);
    await expect(readRecording("extract", "abc", dir)).resolves.toEqual(recording);
  });

  it("explains how to record a missing response", async () => {
    await expect(readRecording("extract", "nope", dir)).rejects.toThrow(MissingRecordingError);
    await expect(readRecording("extract", "nope", dir)).rejects.toThrow(/AI_MODE=record/);
  });
});
