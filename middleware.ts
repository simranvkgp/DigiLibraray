import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Enforces, in order: signed-in -> registered -> approved -> category chosen.
// Also fences off /admin to ADMIN / SUPER_ADMIN roles only.
export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const path = nextUrl.pathname;

  const isPublic = path === "/login" || path.startsWith("/api/auth");
  if (isPublic) return NextResponse.next();

  const isAdminRoute = path.startsWith("/admin") || path.startsWith("/api/admin");

  // Non-admin API routes enforce their own auth (each handler calls auth()
  // and returns 401/403 JSON as needed). They must be exempted from the
  // page-redirect logic below: paths like "/api/register" and
  // "/api/category" don't match the "/register" / "/category" page-prefix
  // checks, so without this the onboarding funnel would silently redirect
  // those fetch() calls to the corresponding HTML page instead of letting
  // them reach the actual route handler.
  if (path.startsWith("/api") && !isAdminRoute) {
    return NextResponse.next();
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const user = session.user as any;
  const isOnboardingRoute = path.startsWith("/register") || path.startsWith("/category");

  if (isAdminRoute) {
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Regular-user onboarding funnel
  if (user.approvalStatus === "INCOMPLETE" && !isOnboardingRoute) {
    return NextResponse.redirect(new URL("/register", nextUrl));
  }
  if (user.approvalStatus === "PENDING" && path !== "/pending-approval") {
    return NextResponse.redirect(new URL("/pending-approval", nextUrl));
  }
  if (["REJECTED", "SUSPENDED"].includes(user.approvalStatus) && path !== "/account-restricted") {
    return NextResponse.redirect(new URL("/account-restricted", nextUrl));
  }
  if (
    user.approvalStatus === "APPROVED" &&
    !user.categoryLocked &&
    path !== "/category"
  ) {
    return NextResponse.redirect(new URL("/category", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
