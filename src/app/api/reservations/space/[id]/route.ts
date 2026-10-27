import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maskEmailOrName } from "@/lib/space-status";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/reservations/space/[id] -> Historial/Estado público con identidad enmascarada (Regla 17)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { spaceId: id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({
        success: true,
        reserved: false,
        reservation: null,
      });
    }

    return NextResponse.json({
      success: true,
      reserved: true,
      reservation: {
        id: reservation.id,
        reservedAt: reservation.reservedAt,
        totalAmount: reservation.totalAmount,
        // Regla 17: Privacidad en Historial Público (Identidad enmascarada)
        reservedByMasked: maskEmailOrName(reservation.user.name, reservation.user.email),
      },
    });
  } catch (error) {
    console.error("Error al consultar reserva pública:", error);
    return NextResponse.json(
      { error: "Error al consultar estado de reserva" },
      { status: 500 }
    );
  }
}
