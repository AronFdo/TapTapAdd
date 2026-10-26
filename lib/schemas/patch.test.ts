import { describe, expect, it } from "vitest";
import { JsonPatchSchema, parsePointer, patchRoots } from "./patch";

describe("parsePointer", () => {
  it("decodes escapes", () => {
    expect(parsePointer("/profile/a~1b/c~0d")).toEqual(["profile", "a/b", "c~d"]);
  });

  it.each(["", "profile/name", "/profile/~2"])("rejects %j", (pointer) => {
    expect(parsePointer(pointer)).toBeNull();
  });
});

describe("JsonPatchSchema", () => {
  it("accepts every RFC 6902 operation under the editable roots", () => {
    const patch = [
      { op: "replace", path: "/profile/summary", value: "Shorter bio" },
      { op: "add", path: "/layout/sections/-", value: { component: "fun-fact" } },
      { op: "remove", path: "/layout/sections/3" },
      { op: "move", from: "/layout/sections/2", path: "/layout/sections/0" },
      { op: "copy", from: "/profile/headline", path: "/profile/summary" },
      { op: "test", path: "/tokens/vibe", value: "orbit" },
    ];
    expect(JsonPatchSchema.safeParse(patch).success).toBe(true);
  });

  it.each([
    ["an empty patch", []],
    ["the document root", [{ op: "remove", path: "" }]],
    ["an unknown root", [{ op: "replace", path: "/userId", value: "x" }]],
    ["an unknown root in from", [{ op: "copy", from: "/secrets/key", path: "/profile/summary" }]],
    ["a prototype path", [{ op: "add", path: "/profile/__proto__/admin", value: true }]],
    ["a constructor path", [{ op: "add", path: "/layout/constructor/prototype", value: {} }]],
    ["an unknown op", [{ op: "merge", path: "/profile", value: {} }]],
    ["a missing value", [{ op: "replace", path: "/profile/name" }]],
    ["move without from", [{ op: "move", path: "/layout/sections/0" }]],
    ["extra keys", [{ op: "remove", path: "/profile/summary", value: "x" }]],
    ["too many operations", Array.from({ length: 51 }, () => ({ op: "remove", path: "/profile/summary" }))],
  ])("rejects %s", (_, patch) => {
    expect(JsonPatchSchema.safeParse(patch).success).toBe(false);
  });
});

describe("patchRoots", () => {
  it("reports every root a patch touches, including move sources", () => {
    const patch = JsonPatchSchema.parse([
      { op: "replace", path: "/profile/summary", value: "x" },
      { op: "move", from: "/tokens/accent", path: "/layout/sections/0" },
    ]);
    expect([...patchRoots(patch)].sort()).toEqual(["layout", "profile", "tokens"]);
  });
});
