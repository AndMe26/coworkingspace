import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { REFRESH_COOKIE_NAME, setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No se proporcionó refresh token" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      const res = NextResponse.json({ error: "Refresh token inválido o expirado" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.refreshTokenHash) {
      const res = NextResponse.json({ error: "Sesión revocada" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    // Verificar hash del refresh token en base de datos
    const isTokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isTokenMatch) {
      // Posible reutilización indebida de token: revocar
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      const res = NextResponse.json({ error: "Token revocado por seguridad" }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    // Rotar ambos tokens
    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    setAuthCookies(response, newAccessToken, newRefreshToken);
    return response;
  } catch (error) {
    console.error("Error en refresh token:", error);
    return NextResponse.json({ error: "Error al refrescar token" }, { status: 500 });
  }
}
