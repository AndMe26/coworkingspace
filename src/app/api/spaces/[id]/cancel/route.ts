import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { resolveSpaceStatus } from "@/lib/space-status";
import { SpaceStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/spaces/[id]/cancel -> Cancelación por parte del Anfitrión (Regla 13)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const space = await prisma.space.findUnique({
      where: { id },
      include: { reservation: true },
    });

    if (!space) {
      return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
    }

    // Anti-IDOR: El anfitrión solo puede cancelar sus propios espacios
    if (space.hostId !== user.userId) {
      return NextResponse.json(
        { error: "Solo el anfitrión propietario puede cancelar este espacio" },
        { status: 403 }
      );
    }

    // Regla de Negocio 13: El anfitrión solo puede cancelar si NADIE lo ha reservado aún
    if (space.reservation) {
      return NextResponse.json(
        { error: "No puedes cancelar este espacio porque ya cuenta con una reserva activa" },
        { status: 409 }
      );
    }

    const realStatus = resolveSpaceStatus(space);
    if (realStatus !== SpaceStatus.AVAILABLE) {
      return NextResponse.json(
        { error: `El espacio ya se encuentra en estado ${realStatus} y no puede ser cancelado` },
        { status: 400 }
      );
    }

    const updated = await prisma.space.update({
      where: { id },
      data: {
        status: SpaceStatus.CANCELLED,
        cancelReason: "Cancelado voluntariamente por el anfitrión",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Espacio cancelado exitosamente por el anfitrión",
      space: updated,
    });
  } catch (error) {
    console.error("Error al cancelar espacio:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la cancelación" },
      { status: 500 }
    );
  }
}
