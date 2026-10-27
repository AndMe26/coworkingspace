import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { SpaceStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/spaces/[id]/cancel -> Cancelación por Moderación / ADMIN (Regla 14)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado: solo el administrador puede moderar espacios" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { reason } = await req.json();

    // Regla de Negocio 14: Motivo obligatorio registrado en la base de datos
    if (!reason || !reason.trim() || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "El motivo de cancelación por moderación es obligatorio y debe tener al menos 10 caracteres" },
        { status: 400 }
      );
    }

    const space = await prisma.space.findUnique({
      where: { id },
    });

    if (!space) {
      return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
    }

    // Regla de Negocio 14 & 15: El admin puede cancelar incluso si ya fue reservado,
    // y ningún espacio se elimina físicamente (DELETE)
    const updated = await prisma.space.update({
      where: { id },
      data: {
        status: SpaceStatus.CANCELLED,
        cancelReason: `[MODERACIÓN ADMIN] ${reason.trim()}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Espacio cancelado por moderación administrativa exitosamente",
      space: updated,
    });
  } catch (error) {
    console.error("Error en moderación de espacio:", error);
    return NextResponse.json(
      { error: "Error al procesar la cancelación administrativa" },
      { status: 500 }
    );
  }
}
