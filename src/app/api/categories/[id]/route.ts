import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/categories/[id] -> Modificar categoría (ADMIN)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const { name, description } = await req.json();

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("Error al editar categoría:", error);
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
  }
}

// DELETE /api/categories/[id] -> Eliminar categoría (Regla 16: Protección de Categorías)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    // Regla de Negocio 16: Una categoría que tenga espacios asociados NO se puede eliminar
    const spacesCount = await prisma.space.count({
      where: { categoryId: id },
    });

    if (spacesCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la categoría porque tiene ${spacesCount} espacio(s) de coworking asociado(s)`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Categoría eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}
