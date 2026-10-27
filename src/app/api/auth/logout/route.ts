import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { clearAuthCookies } from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (user) {
      // Limpiar hash de refresh token en BD
      await prisma.user.update({
        where: { id: user.userId },
        data: { refreshTokenHash: null },
      }).catch(() => null);
    }

    const response = NextResponse.json({
      success: true,
      message: "Sesión cerrada correctamente",
    });

    clearAuthCookies(response);
    return response;
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  }
}
