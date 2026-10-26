import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { generateJson } from "./client";
import { readRecording } from "./recordings";

vi.mock("./recordings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./recordings")>()),
  readRecording: vi.fn(),
  writeRecording: vi.fn(),
}));

const create = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { create } };
  },
}));

const Schema = z.object({ name: z.string(), skills: z.array(z.string()) });
const request = { task: "extract" as const, system: "Extract.", prompt: "CV text", schema: Schema };

describe("generateJson in replay mode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns validated data from the recording without calling the API", async () => {
    vi.mocked(readRecording).mockResolvedValue({
      key: "k",
      task: "extract",
      model: "m",
      output: { name: "Test Person", skills: ["Excel"] },
    });

    const result = await generateJson(request);

    expect(result).toEqual({
      ok: true,
      data: { name: "Test Person", skills: ["Excel"] },
      raw: { name: "Test Person", skills: ["Excel"] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("returns validation issues so the caller can retry", async () => {
    vi.mocked(readRecording).mockResolvedValue({
      key: "k",
      task: "extract",
      model: "m",
      output: { name: 42 },
    });

    const result = await generateJson(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path.join("."))).toEqual(["name", "skills"]);
    }
  });

  it("uses the same recording key for the same request", async () => {
    vi.mocked(readRecording).mockResolvedValue({ key: "k", task: "extract", model: "m", output: {} });
    await generateJson(request);
    await generateJson(request);
    const [first, second] = vi.mocked(readRecording).mock.calls;
    expect(first?.[1]).toBe(second?.[1]);
  });
});
