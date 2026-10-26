import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";

/**
 * An in-process Postgres (PGlite) with the migrations applied, so schema and
 * RLS tests run in CI without Docker. It stands in for the parts of Supabase
 * the migrations rely on: the API roles, auth.users, auth.uid() and the
 * default grants Supabase gives those roles on the public schema.
 *
 * It is a close model, not Supabase itself. `pnpm db:reset` against local
 * Supabase remains the final check that migrations apply.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

const SUPABASE_STAND_INS = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;

  grant usage on schema public, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

export type Actor = "anon" | "service" | { userId: string };

export type TestDatabase = {
  db: PGlite;
  /** Adds a row to auth.users and returns its id. */
  createUser: () => Promise<string>;
  /** Runs `fn` in a transaction as the given API role, like a request through PostgREST. */
  as: <T>(actor: Actor, fn: (tx: Transaction) => Promise<T>) => Promise<T>;
};

export async function migrationFiles(): Promise<string[]> {
  const names = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql")).sort();
  return names.map((name) => path.join(MIGRATIONS_DIR, name));
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const db = await PGlite.create();
  await db.exec(SUPABASE_STAND_INS);
  for (const file of await migrationFiles()) {
    await db.exec(await readFile(file, "utf8"));
  }

  return {
    db,
    async createUser() {
      const id = randomUUID();
      await db.query("insert into auth.users (id) values ($1)", [id]);
      return id;
    },
    as(actor, fn) {
      return db.transaction(async (tx) => {
        if (actor === "anon") {
          await tx.exec("set local role anon");
        } else if (actor === "service") {
          await tx.exec("set local role service_role");
        } else {
          await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [actor.userId]);
          await tx.exec("set local role authenticated");
        }
        return fn(tx);
      });
    },
  };
}
