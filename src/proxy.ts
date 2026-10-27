import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAccessToken, verifyRefreshToken } from "@/lib/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPrivateRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/spaces/new") || pathname.includes("/edit");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAuthRoute && !isPrivateRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  let user = accessToken ? await verifyAccessToken(accessToken) : null;

  // Si el access token expiró pero tiene refresh token válido
  if (!user && refreshToken) {
    user = await verifyRefreshToken(refreshToken);
  }

  // Si ya está autenticado e intenta ir a /login o /register
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si intenta ir a ruta privada sin sesión
  if (isPrivateRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si intenta ir a ruta de administración
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/spaces/new",
    "/spaces/:id/edit",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
