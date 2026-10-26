import { z } from "zod";

/**
 * RFC 6902 JSON Patch, restricted to the editable document
 * `{ profile, layout, tokens }`. Applying a patch and validating the result
 * against the schemas happens in lib/ai/edit.ts (Phase 6). This file only
 * guarantees that a patch can't reach anything outside those three roots.
 */

export const PATCH_ROOTS = ["profile", "layout", "tokens"] as const;
export type PatchRoot = (typeof PATCH_ROOTS)[number];

// Segments that could pollute prototypes when a patch is applied to plain objects.
const FORBIDDEN_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

/** Decodes an RFC 6901 pointer into segments, or returns null if it is malformed. */
export function parsePointer(pointer: string): string[] | null {
  if (!pointer.startsWith("/")) return null;
  const raw = pointer.slice(1).split("/");
  // "~" must be followed by 0 or 1.
  if (raw.some((segment) => /~(?![01])/.test(segment))) return null;
  return raw.map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

export const PatchPointerSchema = z
  .string()
  .max(300)
  .superRefine((pointer, ctx) => {
    const segments = parsePointer(pointer);
    if (!segments) {
      ctx.addIssue({ code: "custom", message: "Not a valid JSON Pointer" });
      return;
    }
    if (!(PATCH_ROOTS as readonly string[]).includes(segments[0] ?? "")) {
      ctx.addIssue({ code: "custom", message: `Paths must start with /${PATCH_ROOTS.join(", /")}` });
    }
    if (segments.some((segment) => FORBIDDEN_SEGMENTS.has(segment))) {
      ctx.addIssue({ code: "custom", message: "Path contains a forbidden segment" });
    }
  });

const path = PatchPointerSchema;

export const PatchOperationSchema = z.discriminatedUnion("op", [
  z.strictObject({ op: z.literal("add"), path, value: z.unknown() }),
  z.strictObject({ op: z.literal("remove"), path }),
  z.strictObject({ op: z.literal("replace"), path, value: z.unknown() }),
  z.strictObject({ op: z.literal("move"), from: path, path }),
  z.strictObject({ op: z.literal("copy"), from: path, path }),
  z.strictObject({ op: z.literal("test"), path, value: z.unknown() }),
]);

export const JsonPatchSchema = z.array(PatchOperationSchema).min(1).max(50);

export type PatchOperation = z.infer<typeof PatchOperationSchema>;
export type JsonPatch = z.infer<typeof JsonPatchSchema>;

/** The roots a patch touches, used to reject look changes the user didn't ask for. */
export function patchRoots(patch: JsonPatch): Set<PatchRoot> {
  const roots = new Set<PatchRoot>();
  for (const op of patch) {
    for (const pointer of "from" in op ? [op.from, op.path] : [op.path]) {
      const root = parsePointer(pointer)?.[0];
      if (root) roots.add(root as PatchRoot);
    }
  }
  return roots;
}
