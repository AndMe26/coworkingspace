import { PrismaClient, SpaceStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando siembra ampliada de datos (seed)...");

  // Limpiar datos existentes en orden de dependencias
  await prisma.reservation.deleteMany();
  await prisma.space.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const adminPasswordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "AdminPassword123!",
    10
  );

  // 1. Crear Usuarios (Admin + Anfitriones + Reservantes)
  const admin = await prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || "Administrador PlanCity",
      email: process.env.ADMIN_EMAIL || "admin@plancity.com",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const hostCarlos = await prisma.user.create({
    data: {
      name: "Carlos Anfitrión",
      email: "carlos@plancity.com",
      passwordHash,
      role: Role.USER,
    },
  });

  const hostElena = await prisma.user.create({
    data: {
      name: "Elena Cowork",
      email: "elena@plancity.com",
      passwordHash,
      role: Role.USER,
    },
  });

  const hostMateo = await prisma.user.create({
    data: {
      name: "Mateo Innovation Hub",
      email: "mateo@plancity.com",
      passwordHash,
      role: Role.USER,
    },
  });

  const memberSofia = await prisma.user.create({
    data: {
      name: "Sofía Reservas",
      email: "sofia@plancity.com",
      passwordHash,
      role: Role.USER,
    },
  });

  const memberAndres = await prisma.user.create({
    data: {
      name: "Andrés Gómez",
      email: "andres@plancity.com",
      passwordHash,
      role: Role.USER,
    },
  });

  console.log("✓ Usuarios creados");

  // 2. Crear 7 Categorías de Coworking Diversas
  const catBoardroom = await prisma.category.create({
    data: {
      name: "Sala de Juntas Ejecutiva",
      slug: "sala-de-juntas",
      description: "Salas de reuniones equipadas con pantalla 4K, videoconferencia y pizarras inteligentes.",
    },
  });

  const catPrivateOffice = await prisma.category.create({
    data: {
      name: "Oficina Privada",
      slug: "oficina-privada",
      description: "Oficinas individuales o para equipos reducidos con aislamiento acústico y cerradura inteligente.",
    },
  });

  const catHotDesk = await prisma.category.create({
    data: {
      name: "Hot Desk Coworking",
      slug: "hot-desk",
      description: "Puestos de trabajo flexibles en áreas compartidas con café ilimitado y wifi ultrarrápido.",
    },
  });

  const catPodcastStudio = await prisma.category.create({
    data: {
      name: "Estudio de Grabación & Podcast",
      slug: "estudio-podcast",
      description: "Espacios insonorizados con micrófonos Shure, mezcladora de audio e iluminación profesional.",
    },
  });

  const catEventTerrace = await prisma.category.create({
    data: {
      name: "Terraza & Espacio de Eventos",
      slug: "terraza-eventos",
      description: "Azoteas panorámicas y áreas al aire libre para lanzamientos, networking o workshops corporativos.",
    },
  });

  const catQuietBooth = await prisma.category.create({
    data: {
      name: "Cabina Insonorizada Phone Booth",
      slug: "cabina-silenciosa",
      description: "Cabinas individuales de alta insonorización con ventilación activa para llamadas confidenciales y videollamadas 1 a 1.",
    },
  });

  const catCreativeLab = await prisma.category.create({
    data: {
      name: "Laboratorio Creativo & Design Sprint",
      slug: "laboratorio-creativo",
      description: "Espacio colaborativo con mobiliario móvil, múltiples pizarras de cristal y proyectores interactivos.",
    },
  });

  console.log("✓ 7 Categorías creadas exitosamente");

  const now = new Date();

  // 3. Crear 10 Espacios distribuidos en los 4 Estados del Ciclo de Vida:

  // --- DISPONIBLES (AVAILABLE) ---
  const s1 = await prisma.space.create({
    data: {
      title: "Sala Boardroom Aurora - Vista Panorámica",
      description: "Espectacular sala de conferencias para 10 personas con luz natural, proyector láser 4K, sistema Logitech Rally y café gourmet ilimitado.",
      address: "Carrera 7 # 71-21, Torre B, Piso 14, Bogotá",
      capacity: 10,
      price: 280000.00,
      serviceFee: 28000.00,
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.AVAILABLE,
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Vence en 3 días
      hostId: hostCarlos.id,
      categoryId: catBoardroom.id,
    },
  });

  const s2 = await prisma.space.create({
    data: {
      title: "Oficina Suite Minimalista SkyView",
      description: "Oficina privada ergonómica para 3 personas. Incluye escritorios elevables Herman Miller, sillas Embody y pantallas duales de 27 pulgadas.",
      address: "Calle 93 # 12-40, Chicó Norte, Bogotá",
      capacity: 3,
      price: 195000.00,
      serviceFee: 20000.00,
      imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.AVAILABLE,
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Vence en 2 días
      hostId: hostElena.id,
      categoryId: catPrivateOffice.id,
    },
  });

  const s3 = await prisma.space.create({
    data: {
      title: "Puesto Flexible Hub Central con Fibra Óptica",
      description: "Hot Desk en espacio colaborativo abierto con terraza, acceso 24/7, barra de café de especialidad y lockers con clave digital.",
      address: "Carrera 43A # 1-50, El Poblado, Medellín",
      capacity: 1,
      price: 45000.00,
      serviceFee: 5000.00,
      imageUrl: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.AVAILABLE,
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Vence en 5 días
      hostId: hostCarlos.id,
      categoryId: catHotDesk.id,
    },
  });

  const s4 = await prisma.space.create({
    data: {
      title: "Rooftop Lounge & Terraza Corporativa",
      description: "Terraza al aire libre con vista a los cerros orientales, sistema de sonido envolvente Bose, iluminación cálida y zona de networking.",
      address: "Calle 85 # 11-53, Zona Rosa, Bogotá",
      capacity: 25,
      price: 650000.00,
      serviceFee: 65000.00,
      imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.AVAILABLE,
      expiresAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // Vence en 6 días
      hostId: hostMateo.id,
      categoryId: catEventTerrace.id,
    },
  });

  const s5 = await prisma.space.create({
    data: {
      title: "Cabina Focus Pro Acústica",
      description: "Cabina insonorizada de última generación Framery Q. Asiento ergonómico, luz neutra regulable para videollamadas de ventas o juntas críticas.",
      address: "Carrera 11 # 86-32, El Retiro, Bogotá",
      capacity: 1,
      price: 35000.00,
      serviceFee: 4000.00,
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.AVAILABLE,
      expiresAt: new Date(now.getTime() + 18 * 60 * 60 * 1000), // Vence en 18 horas
      hostId: hostElena.id,
      categoryId: catQuietBooth.id,
    },
  });

  const s6 = await prisma.space.create({
    data: {
      title: "Taller Creativo Design Thinking & Sprints",
      description: "Espacio modular con gradas de madera, pizarras magnéticas móviles, kit completo de prototipado rápido y cafetera espresso Rancilio.",
      address: "Calle 10B # 35-42, Provenza, Medellín",
      capacity: 14,
      price: 380000.00,
      serviceFee: 38000.00,
      imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.AVAILABLE,
      expiresAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // Vence en 4 días
      hostId: hostMateo.id,
      categoryId: catCreativeLab.id,
    },
  });

  // --- RESERVADOS (RESERVED) - Bloqueados exclusivamente ---
  const s7 = await prisma.space.create({
    data: {
      title: "Estudio Creativo Acústico SoundLab",
      description: "Estudio para podcasts y videocasting con 4 micrófonos Rode PodMic, interfaz Rodecaster Pro II y paneles de difusión acústica.",
      address: "Calle 10 # 36-14, Provenza, Medellín",
      capacity: 4,
      price: 220000.00,
      serviceFee: 22000.00,
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.RESERVED,
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      hostId: hostElena.id,
      categoryId: catPodcastStudio.id,
    },
  });

  await prisma.reservation.create({
    data: {
      spaceId: s7.id,
      userId: memberSofia.id,
      totalAmount: 242000.00,
      reservedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Hace 2 horas
    },
  });

  const s8 = await prisma.space.create({
    data: {
      title: "Sala VIP Directorio Financiero",
      description: "Mesa de caoba para 8 personas con pantalla interactiva Samsung Flip de 85 pulgadas y servicio de catering de bebidas.",
      address: "Calle 72 # 10-07, Centro Financiero, Bogotá",
      capacity: 8,
      price: 310000.00,
      serviceFee: 31000.00,
      imageUrl: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.RESERVED,
      expiresAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      hostId: hostCarlos.id,
      categoryId: catBoardroom.id,
    },
  });

  await prisma.reservation.create({
    data: {
      spaceId: s8.id,
      userId: memberAndres.id,
      totalAmount: 341000.00,
      reservedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000), // Hace 5 horas
    },
  });

  // --- EXPIRADOS (EXPIRED) - Ventana vencida sin reservas (Desierto) ---
  const s9 = await prisma.space.create({
    data: {
      title: "Oficina Boutique Virrey Garden",
      description: "Oficina privada iluminada frente al Parque El Virrey con estación de té y café orgánico para 2 personas.",
      address: "Calle 87 # 15-23, El Virrey, Bogotá",
      capacity: 2,
      price: 160000.00,
      serviceFee: 16000.00,
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.EXPIRED,
      expiresAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // Expiró hace 8 horas
      hostId: hostMateo.id,
      categoryId: catPrivateOffice.id,
    },
  });

  // --- CANCELADOS (CANCELLED) - Moderados con motivo obligatorio ---
  const s10 = await prisma.space.create({
    data: {
      title: "Suite Ejecutiva Terraza Poblado",
      description: "Oficina privada amplia con balcón que tuvo que ser suspendida temporalmente por mantenimiento eléctrico mayor en el edificio.",
      address: "Transversal 6 # 45-20, El Poblado, Medellín",
      capacity: 6,
      price: 450000.00,
      serviceFee: 45000.00,
      imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
      status: SpaceStatus.CANCELLED,
      cancelReason: "[MODERACIÓN ADMIN] Suspendido por mantenimiento técnico programado en la red eléctrica del piso 5 reportado por administración.",
      expiresAt: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      hostId: hostElena.id,
      categoryId: catPrivateOffice.id,
    },
  });

  console.log("✓ 10 Espacios creados en los 4 estados (AVAILABLE, RESERVED, EXPIRED, CANCELLED)");
  console.log("🚀 Seed ampliado completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
