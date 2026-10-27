import { NextRequest } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/auth-cookies";
import { verifyAccessToken, TokenPayload } from "@/lib/jwt";

export async function getAuthUser(req: NextRequest): Promise<TokenPayload | null> {
  const token = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyAccessToken(token);
}

export function createErrorResponse(message: string, status: number) {
  return Response.json({ success: false, error: message }, { status });
}
