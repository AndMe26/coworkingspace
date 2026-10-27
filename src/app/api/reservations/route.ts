import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { resolveSpaceStatus } from "@/lib/space-status";
import { SpaceStatus } from "@prisma/client";

// POST /api/reservations -> Mecanismo de concurrencia exclusivo "Si reserva uno, nadie más puede"
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión para reservar un espacio" }, { status: 401 });
    }

    const { spaceId } = await req.json();

    if (!spaceId) {
      return NextResponse.json({ error: "El identificador del espacio es obligatorio" }, { status: 400 });
    }

    const now = new Date();

    // Transacción Atómica con verificación optimista y restricción física de PostgreSQL
    const reservation = await prisma.$transaction(async (tx) => {
      // 1. Obtener el espacio
      const space = await tx.space.findUnique({
        where: { id: spaceId },
        include: { reservation: true },
      });

      if (!space) {
        throw { status: 404, message: "El espacio de coworking no existe" };
      }

      // Regla de Negocio 6: Prohibición de Auto-reserva
      if (space.hostId === user.userId) {
        throw {
          status: 403,
          message: "No puedes reservar tu propio espacio de coworking publicado",
        };
      }

      // Regla de Negocio 7 & 8: Solo se puede reservar si está AVAILABLE y no expirado
      const computed = resolveSpaceStatus(space, now);
      if (computed !== SpaceStatus.AVAILABLE || space.reservation) {
        throw {
          status: 409,
          message: "Este espacio ya fue reservado por otra persona o ya no está disponible",
        };
      }

      // 2. Bloqueo atómico condicional: solo cambia a RESERVED si sigue AVAILABLE
      const updateResult = await tx.space.updateMany({
        where: {
          id: spaceId,
          status: SpaceStatus.AVAILABLE,
          expiresAt: { gt: now },
        },
        data: {
          status: SpaceStatus.RESERVED,
        },
      });

      // Si count es 0, otro usuario confirmó la reserva en el mismo instante
      if (updateResult.count === 0) {
        throw {
          status: 409,
          message: "Conflicto: Otro usuario acaba de confirmar la reserva de este espacio",
        };
      }

      // 3. Crear el registro físico de la reserva (con clave única en spaceId)
      const totalAmount = Number(space.price) + Number(space.serviceFee);
      return await tx.reservation.create({
        data: {
          spaceId,
          userId: user.userId,
          totalAmount,
        },
        include: {
          space: {
            include: { category: true },
          },
        },
      });
    });

    return NextResponse.json({ success: true, reservation }, { status: 201 });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // P2002 es el código de Prisma para Unique Constraint Violation en BD
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Conflicto: Este espacio ya fue reservado de forma definitiva" },
        { status: 409 }
      );
    }

    console.error("Error al procesar reserva:", error);
    return NextResponse.json({ error: "Error interno al procesar la reserva" }, { status: 500 });
  }
}

// GET /api/reservations -> Consultar mis reservas realizadas (Regla 19: Privacidad de Reservas)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId: user.userId },
      include: {
        space: {
          include: {
            category: true,
            host: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { reservedAt: "desc" },
    });

    return NextResponse.json({ success: true, reservations });
  } catch (error) {
    console.error("Error al obtener reservas del usuario:", error);
    return NextResponse.json(
      { error: "Error al consultar tus reservas" },
      { status: 500 }
    );
  }
}
