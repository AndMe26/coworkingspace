import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { resolveSpaceStatus } from "@/lib/space-status";
import { SpaceStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/spaces/[id] -> Detalle de espacio individual con cálculo en tiempo real
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        category: true,
        host: {
          select: { id: true, name: true, email: true },
        },
        reservation: {
          select: {
            id: true,
            reservedAt: true,
            totalAmount: true,
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!space) {
      return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
    }

    const computedStatus = resolveSpaceStatus(space);

    return NextResponse.json({
      success: true,
      space: {
        ...space,
        computedStatus,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de espacio:", error);
    return NextResponse.json(
      { error: "Error al consultar el espacio" },
      { status: 500 }
    );
  }
}

// PATCH /api/spaces/[id] -> Editar espacio (Solo anfitrión y si no tiene reserva y sigue AVAILABLE)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingSpace = await prisma.space.findUnique({
      where: { id },
      include: { reservation: true },
    });

    if (!existingSpace) {
      return NextResponse.json({ error: "Espacio no encontrado" }, { status: 404 });
    }

    // Regla de Negocio 18: Anti-IDOR (Solo el anfitrión o ADMIN)
    if (existingSpace.hostId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para modificar este espacio" },
        { status: 403 }
      );
    }

    // Regla de Negocio 5: Solo se puede editar si NO tiene reserva y está en estado AVAILABLE
    const realStatus = resolveSpaceStatus(existingSpace);
    if (existingSpace.reservation || realStatus !== SpaceStatus.AVAILABLE) {
      return NextResponse.json(
        {
          error:
            "No se puede editar el espacio: ya cuenta con una reserva o ha cambiado de estado",
        },
        { status: 400 }
      );
    }

    const { title, description, address, capacity, price, serviceFee, imageUrl, categoryId } = body;

    const updated = await prisma.space.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        address: address !== undefined ? String(address).trim() : undefined,
        capacity: capacity !== undefined ? Number(capacity) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        serviceFee: serviceFee !== undefined ? Number(serviceFee) : undefined,
        imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : undefined,
        categoryId: categoryId !== undefined ? String(categoryId) : undefined,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, space: updated });
  } catch (error) {
    console.error("Error al editar espacio:", error);
    return NextResponse.json(
      { error: "Error al actualizar los datos del espacio" },
      { status: 500 }
    );
  }
}
