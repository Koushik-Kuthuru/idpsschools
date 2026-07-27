import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function withPortalCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

/** Allow Expo mobile/web clients (separate dev ports) to call portal APIs. */
export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return withPortalCors(request, new NextResponse(null, { status: 204 }));
  }
  return withPortalCors(request, NextResponse.next());
}

export const config = {
  matcher: "/api/portal/:path*",
};
