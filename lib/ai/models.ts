/**
 * The only place model ids are configured. Each AI task picks a tier here.
 * Revisit after the Phase 3 extraction eval; changing a model invalidates
 * recorded fixtures for its tasks, so re-record them in the same change.
 */
export const MODELS = {
  /** Extraction and layout generation: quality matters most. */
  strong: "claude-opus-5-5",
  /** Small chat edits: cheaper and faster. */
  fast: "claude-sonnet-5-5",
} as const;

export type ModelTier = keyof typeof MODELS;
export type Effort = "low" | "medium" | "high";

export type TaskConfig = {
  tier: ModelTier;
  effort: Effort;
  maxTokens: number;
};

export const TASKS = {
  extract: { tier: "strong", effort: "medium", maxTokens: 16000 },
  layout: { tier: "strong", effort: "high", maxTokens: 16000 },
  edit: { tier: "fast", effort: "low", maxTokens: 8000 },
} as const satisfies Record<string, TaskConfig>;

export type AiTask = keyof typeof TASKS;

export function modelFor(task: AiTask): string {
  return MODELS[TASKS[task].tier];
}
