export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Fail at startup, not on the first request, when configuration is missing.
  const { publicEnv, serverEnv } = await import("@/lib/env");
  publicEnv();
  serverEnv();
}
