import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
});

const ServerEnvSchema = z
  .object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ANTHROPIC_API_KEY: z.string().min(1),
    // live: call the API. record: call the API and save responses as fixtures.
    // replay: answer only from saved fixtures, never touching the network.
    AI_MODE: z.enum(["live", "record", "replay"]).default("live"),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  })
  .refine((env) => env.VERCEL_ENV !== "production" || env.AI_MODE === "live", {
    message: "AI_MODE must be live in production",
    path: ["AI_MODE"],
  });

export type PublicEnv = z.infer<typeof PublicEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let publicEnvCache: PublicEnv | undefined;
let serverEnvCache: ServerEnv | undefined;

export function publicEnv(): PublicEnv {
  // Each NEXT_PUBLIC_ variable is named literally so Next.js can inline it.
  publicEnvCache ??= PublicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
  });
  return publicEnvCache;
}

export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser");
  }
  serverEnvCache ??= ServerEnvSchema.parse(process.env);
  return serverEnvCache;
}

// The proxy needs only the root domain, so it doesn't fail on unrelated variables.
export function rootDomain(): string {
  return z.string().min(1).parse(process.env.NEXT_PUBLIC_ROOT_DOMAIN);
}
