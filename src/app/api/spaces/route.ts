import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";
import { resolveSpaceStatus } from "@/lib/space-status";
import { SpaceStatus } from "@prisma/client";

// GET /api/spaces -> Listar espacios con filtros (categoría, estado, búsqueda, precio)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const statusParam = searchParams.get("status");
    const query = searchParams.get("q");
    const hostId = searchParams.get("hostId");

    const where: any = {};

    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }

    if (hostId) {
      where.hostId = hostId;
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ];
    }

    const spaces = await prisma.space.findMany({
      where,
      include: {
        category: true,
        host: {
          select: { id: true, name: true },
        },
        reservation: {
          select: { id: true, reservedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    // Resolver en tiempo real el estado de cada espacio (AVAILABLE -> EXPIRED si pasó expiresAt)
    const spacesWithRealStatus = spaces.map((space) => {
      const computedStatus = resolveSpaceStatus(space, now);
      return {
        ...space,
        computedStatus,
      };
    });

    // Si se filtró por un estado específico, aplicar sobre el estado computado en tiempo real
    const filteredSpaces = statusParam
      ? spacesWithRealStatus.filter((s) => s.computedStatus === statusParam)
      : spacesWithRealStatus;

    return NextResponse.json({ success: true, spaces: filteredSpaces });
  } catch (error) {
    console.error("Error al obtener espacios:", error);
    return NextResponse.json(
      { error: "Error al listar los espacios de coworking" },
      { status: 500 }
    );
  }
}

// POST /api/spaces -> Crear un nuevo espacio (Requiere Auth + Valida máx 5 activos + Ventana 1h a 7d)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      address,
      capacity,
      price,
      serviceFee,
      imageUrl,
      categoryId,
      expiresAt,
    } = body;

    // 1. Validaciones de presencia
    if (
      !title ||
      !description ||
      !address ||
      !capacity ||
      price === undefined ||
      serviceFee === undefined ||
      !imageUrl ||
      !categoryId ||
      !expiresAt
    ) {
      return NextResponse.json(
        { error: "Todos los campos del espacio son obligatorios" },
        { status: 400 }
      );
    }

    const numCapacity = Number(capacity);
    const numPrice = Number(price);
    const numServiceFee = Number(serviceFee);

    // Regla de Negocio 1: Tarifas > 0
    if (numPrice <= 0 || numServiceFee <= 0 || numCapacity <= 0) {
      return NextResponse.json(
        { error: "El precio, tarifa de servicio y capacidad deben ser mayores a 0" },
        { status: 400 }
      );
    }

    // Regla de Negocio 2: Ventana de disponibilidad entre 1 hora y 7 días
    const now = new Date();
    const targetExpiresAt = new Date(expiresAt);
    const oneHourAhead = new Date(now.getTime() + 60 * 60 * 1000 - 60000); // 1h margen 1m
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 60000);

    if (targetExpiresAt < oneHourAhead || targetExpiresAt > sevenDaysAhead) {
      return NextResponse.json(
        {
          error:
            "La fecha límite de reserva debe estar entre 1 hora y 7 días a partir de ahora",
        },
        { status: 400 }
      );
    }

    // Regla de Negocio 3: Categoría existente
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "La categoría especificada no existe" },
        { status: 404 }
      );
    }

    // Regla de Negocio 4: Máximo 5 espacios activos (AVAILABLE) por anfitrión
    const activeSpaces = await prisma.space.findMany({
      where: {
        hostId: user.userId,
        status: SpaceStatus.AVAILABLE,
        expiresAt: { gt: now },
      },
    });

    if (activeSpaces.length >= 5) {
      return NextResponse.json(
        {
          error:
            "Has alcanzado el límite máximo de 5 espacios de coworking activos simultáneamente",
        },
        { status: 400 }
      );
    }

    // Crear el espacio
    const newSpace = await prisma.space.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        address: address.trim(),
        capacity: numCapacity,
        price: numPrice,
        serviceFee: numServiceFee,
        imageUrl: imageUrl.trim(),
        expiresAt: targetExpiresAt,
        status: SpaceStatus.AVAILABLE,
        hostId: user.userId,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(
      { success: true, space: newSpace },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear espacio:", error);
    return NextResponse.json(
      { error: "Error interno al publicar el espacio de coworking" },
      { status: 500 }
    );
  }
}
