import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Role-based route protection middleware
 * Maps URL prefixes to required user roles
 */
const ROLE_ROUTES: Record<string, string[]> = {
  "/contractor": ["CONTRACTOR"],
  "/dashboard": ["FUND_MANAGER"],
  "/admin": ["ADMIN"],
  "/audit": ["AUDITOR"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets from public/ — skip auth check
  if (/\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp4|webm|woff2?|ttf|css|js)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Public routes — skip auth check
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/dops-pro") ||
    pathname.startsWith("/api/") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Get JWT token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for protected route prefixes
  for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!allowedRoles.includes(token.role as string)) {
        // Redirect to the user's appropriate home based on their role
        const homePath = getRoleHomePath(token.role as string);
        return NextResponse.redirect(new URL(homePath, request.url));
      }
    }
  }

  return NextResponse.next();
}

/** Map each role to its default landing page */
function getRoleHomePath(role: string): string {
  switch (role) {
    case "CONTRACTOR":
      return "/contractor";
    case "FUND_MANAGER":
      return "/dashboard";
    case "ADMIN":
      return "/admin";
    case "AUDITOR":
      return "/audit";
    default:
      return "/login";
  }
}

export const config = {
  matcher: [
    // Protect all routes except static files and API
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp4|webm)$).*)",
  ],
};
