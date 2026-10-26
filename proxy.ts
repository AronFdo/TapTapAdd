import { NextResponse, type NextRequest } from "next/server";
import { rootDomain } from "@/lib/env";
import { resolveHost } from "@/lib/routing/host";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const target = resolveHost(request.headers.get("host"), rootDomain());

  if (target.kind === "not-found") {
    return new NextResponse(null, { status: 404 });
  }

  if (target.kind === "site") {
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${target.slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Portfolios are only reachable through their subdomain.
  if (pathname === "/sites" || pathname.startsWith("/sites/")) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
