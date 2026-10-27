import { NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "plancity_access_token";
export const REFRESH_COOKIE_NAME = "plancity_refresh_token";

const IS_PROD = process.env.NODE_ENV === "production";

export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  // Access Token Cookie (15 minutos)
  res.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutos en segundos
  });

  // Refresh Token Cookie (7 días)
  res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
  });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
