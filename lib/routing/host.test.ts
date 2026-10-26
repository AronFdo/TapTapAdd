import { describe, expect, it } from "vitest";
import { resolveHost } from "./host";

describe("resolveHost", () => {
  const root = "taptapadd.lk";

  it.each([
    ["taptapadd.lk", { kind: "app" }],
    ["www.taptapadd.lk", { kind: "app" }],
    ["TAPTAPADD.LK", { kind: "app" }],
    ["taptapadd-git-main-team.vercel.app", { kind: "app" }],
    [null, { kind: "app" }],
    ["jane.taptapadd.lk", { kind: "site", slug: "jane" }],
    ["Jane-Perera.taptapadd.lk", { kind: "site", slug: "jane-perera" }],
    ["a.b.taptapadd.lk", { kind: "not-found" }],
    ["-jane.taptapadd.lk", { kind: "not-found" }],
    ["eviltaptapadd.lk", { kind: "app" }],
  ])("%s", (host, expected) => {
    expect(resolveHost(host, root)).toEqual(expected);
  });

  it("ignores ports on both sides for local development", () => {
    expect(resolveHost("localhost:3000", "localhost:3000")).toEqual({ kind: "app" });
    expect(resolveHost("jane.localhost:3000", "localhost:3000")).toEqual({
      kind: "site",
      slug: "jane",
    });
  });
});
