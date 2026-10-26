export type HostTarget =
  | { kind: "app" }
  | { kind: "site"; slug: string }
  | { kind: "not-found" };

// One DNS label: lowercase letters, digits and inner hyphens.
const SLUG_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function stripPort(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

/**
 * Decides whether a request is for the app (root domain) or a portfolio
 * ({slug}.{root}). Hosts outside the root domain, such as Vercel preview
 * URLs, are treated as the app.
 */
export function resolveHost(host: string | null, root: string): HostTarget {
  if (!host) return { kind: "app" };

  const hostname = stripPort(host);
  const rootname = stripPort(root);

  if (hostname === rootname || hostname === `www.${rootname}`) {
    return { kind: "app" };
  }

  const suffix = `.${rootname}`;
  if (!hostname.endsWith(suffix)) return { kind: "app" };

  const label = hostname.slice(0, -suffix.length);
  if (!SLUG_LABEL.test(label)) return { kind: "not-found" };

  return { kind: "site", slug: label };
}
