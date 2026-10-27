import { prisma } from "@/lib/prisma";
import { resolveSpaceStatus } from "@/lib/space-status";
import { HomeClient } from "@/components/layout/HomeClient";

// SSG / ISR: Revalidación periódica
export const revalidate = 60;

async function getFeaturedSpaces() {
  try {
    const spaces = await prisma.space.findMany({
      take: 6,
      include: {
        category: true,
        host: { select: { name: true } },
        reservation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    return spaces.map((space) => ({
      ...space,
      price: Number(space.price),
      serviceFee: Number(space.serviceFee),
      reservation: space.reservation
        ? {
            ...space.reservation,
            totalAmount: Number(space.reservation.totalAmount),
          }
        : null,
      computedStatus: resolveSpaceStatus(space, now),
    }));
  } catch (error) {
    console.error("Error al cargar destacados:", error);
    return [];
  }
}

export default async function HomePage() {
  const spaces = await getFeaturedSpaces();
  return <HomeClient spaces={spaces} />;
}
