# 🏢 PlanCity Coworking — Plan de Arquitectura y Transformación Fullstack

## 1. Visión General del Proyecto
El proyecto consiste en evolucionar la base actual de **PlanCity** (actualmente un frontend que consume una API externa) hacia **PlanCity Coworking**, una plataforma **100% Fullstack en Next.js 16 (App Router)** que cumple estrictamente con todos los requerimientos técnicos y de negocio del estándar **BidHub**.

En lugar de subastas, el giro de negocio es la **publicación y reserva exclusiva de espacios de coworking** (salas de juntas, oficinas privadas, cabinas de llamadas, escritorios dedicados).

> **Regla de Oro (Exclusividad y Bloqueo):** A diferencia de una subasta donde varios usuarios pujan, aquí rige el principio de **reserva única e inmediata**. Si un usuario reserva una sesión/espacio disponible, el estado pasa inmediatamente a **`RESERVADO`** y **ningún otro usuario puede reservarlo** (control de concurrencia en base de datos devolviendo HTTP `409 Conflict`).

---

## 2. Mapeo Exhaustivo de Reglas de Negocio (BidHub ➔ PlanCity Coworking)

Para cumplir al 100% con la rúbrica de evaluación de BidHub pero adaptada a la lógica de reservas exclusivas, se implementa la siguiente equivalencia de las **20 reglas de negocio**:

### A. Publicación de Espacios / Sesiones de Coworking
1. **Tarifas:** Al publicar un espacio/sesión disponible se define un precio base mayor a cero (`price > 0`) y una tarifa de servicio o depósito mínimo mayor a cero.
2. **Ventana de Disponibilidad:** La fecha límite de apertura/reserva de la sesión debe estar entre **1 hora y 7 días** a partir del momento de la publicación.
3. **Categoría Obligatoria:** Cada espacio pertenece a una categoría existente (ej. *Sala de Juntas*, *Oficina Privada*, *Hot Desk*, *Estudio Creativo*).
4. **Límite de Publicaciones Activas:** Un usuario (anfitrión) puede tener **máximo 5 espacios activos (disponibles)** al mismo tiempo.
5. **Edición Restringida:** El anfitrión puede editar su espacio únicamente mientras **no tenga una reserva realizada** y mientras siga en estado activo (`DISPONIBLE`).

### B. Reservas Exclusivas (Bloqueo al Primer Usuario)
6. **Prohibición de Auto-reserva:** Un anfitrión **no puede reservar** su propio espacio publicado.
7. **Validación de Vigencia:** Solo se puede reservar un espacio que esté en estado `DISPONIBLE` (que no haya sido reservado por otro usuario, no esté cancelado y cuya ventana de tiempo no haya expirado).
8. **Regla de Exclusividad (Si uno reserva, nadie más puede):** La primera persona que confirma la reserva bloquea inmediatamente el espacio. Cualquier intento posterior o simultáneo de otro usuario es rechazado con error `409 Conflict`.
9. **Inmutabilidad de Reserva:** Una vez confirmada la reserva por un usuario, esta es definitiva (no se puede editar ni eliminar por el usuario que reservó).
10. **Cuenta Regresiva e Hidratación:** En la vista de detalle se muestra en tiempo real el tiempo restante antes de que expire la ventana de reserva disponible o el bloqueo temporal.

### C. Estados y Ciclo de Vida Dinámico (Sin Cronjobs)
11. **4 Estados Oficiales del Espacio:**
    * **`ACTIVO / DISPONIBLE` (`AVAILABLE`):** Dentro de la ventana de tiempo y sin reserva.
    * **`CERRADO / RESERVADO` (`RESERVED`):** Un usuario tomó el espacio (equivalente a subasta cerrada con ganador) o concluyó la ventana con reserva asignada.
    * **`DESIERTO / EXPIRADO` (`EXPIRED`):** Llegó la fecha límite de la ventana de tiempo y **nadie lo reservó**.
    * **`CANCELADO` (`CANCELLED`):** Retirado por el anfitrión (sin reservas previas) o por un moderador.
12. **Cálculo de Estado en Tiempo Real:** El estado debe ser exacto en cualquier momento en que se consulte mediante cálculo dinámico en el backend (`now >= expiresAt`) sin depender de tareas programadas (cronjobs) ni procesos externos.

### D. Cancelación, Moderación y Categorías
13. **Cancelación por Anfitrión:** El creador del espacio puede cancelarlo únicamente si **nadie lo ha reservado aún**.
14. **Moderación por Administrador:** El administrador puede cancelar cualquier espacio activo (**incluso si ya fue reservado** por alguien, por motivos de fuerza mayor o infracción), registrando un **motivo obligatorio** en la base de datos.
15. **Persistencia Histórica:** Ningún espacio cancelado, expirado o reservado se elimina físicamente (`DELETE`); se conserva en base de datos con su historial completo.
16. **Protección de Categorías:** Una categoría que tenga espacios asociados **no se puede eliminar** (restricción en ORM y base de datos).

### E. Privacidad y Seguridad
17. **Privacidad en Historial Público:** En la ficha pública del espacio, si ya fue reservado o tiene actividad registrada, se muestra la fecha y estado pero se enmascara la identidad del reservante (ej. `j***z@correo.com` o `Juan P.`).
18. **Autorización Estricta (Anti-IDOR):** Un usuario no puede editar ni cancelar espacios de otro usuario aunque manipule el `[id]` en la URL o petición.
19. **Privacidad de Reservas:** Un usuario solo puede consultar el listado detallado de sus propias reservas realizadas.

---

## 3. Arquitectura Técnica y Cambios sobre PlanCity Actual

| Componente | Estado Actual en PlanCity | Nueva Arquitectura PlanCity Coworking |
| :--- | :--- | :--- |
| **Backend / API** | Consume API externa (`NEXT_PUBLIC_API_URL` con Axios) | **Fullstack Nativo:** Route Handlers en `src/app/api/*`. Se elimina dependencia de API externa. |
| **Base de Datos** | Ninguna en el repo | **PostgreSQL en Supabase** + **Prisma ORM** con migraciones y `seed.ts`. |
| **Autenticación** | `cookies-next` accesible en cliente | **Doble JWT (`accessToken` + `refreshToken`)** en cookies `httpOnly`, `secure`, `sameSite`. Refresh token hasheado en BD. |
| **Middleware / Proxy** | `middleware.ts` básico | **`proxy.ts`** para protección perimetral de `(private)` y `(admin)` + validación en cada Route Handler. |
| **Route Groups** | `(admin)`, `(auth)`, `(main)` | **`(public)`**, **`(auth)`**, **`(private)`**, **`(admin)`**. |
| **Renderizado** | Híbrido sin distinción estricta | **SSG** en Home, **SSR** en Catálogo y Detalle `[id]`, **CSR** en Dashboard. |
| **Internacionalización** | Solo Español | **i18n Español / Inglés** con selector visible en Navbar. |

---

## 4. Diseño de Base de Datos (Prisma Schema)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

enum SpaceStatus {
  AVAILABLE   // Activo y libre para reservar
  RESERVED    // Ya reservado por un usuario (bloqueado para el resto)
  EXPIRED     // Expiró el tiempo límite sin que nadie reservara (Desierto)
  CANCELLED   // Cancelado por el anfitrión o por moderación
}

model User {
  id               String        @id @default(uuid())
  name             String
  email            String        @unique
  passwordHash     String
  role             Role          @default(USER)
  refreshTokenHash String?       // Hash del refresh token para rotación y revocación
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  publishedSpaces  Space[]       @relation("HostSpaces")
  reservations     Reservation[]
}

model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  spaces      Space[]
  createdAt   DateTime @default(now())
}

model Space {
  id               String      @id @default(uuid())
  title            String
  description      String
  address          String
  capacity         Int
  price            Decimal     @db.Decimal(10, 2) // Mayor a 0
  serviceFee       Decimal     @db.Decimal(10, 2) // Mayor a 0
  imageUrl         String
  status           SpaceStatus @default(AVAILABLE)
  expiresAt        DateTime    // Entre 1 hora y 7 días desde createdAt
  cancelReason     String?     // Obligatorio cuando cancela el ADMIN

  hostId           String
  host             User        @relation("HostSpaces", fields: [hostId], references: [id])

  categoryId       String
  category         Category    @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  reservation      Reservation? // Relación 1 a 1 activa: si se reserva, nadie más puede
  reservationLogs  Reservation[] @relation("SpaceHistory")

  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  @@index([status, categoryId, expiresAt])
}

model Reservation {
  id          String   @id @default(uuid())
  totalAmount Decimal  @db.Decimal(10, 2)
  reservedAt  DateTime @default(now())

  // Clave única en spaceId garantiza en BD que NO puedan existir dos reservas para el mismo espacio
  spaceId     String   @unique
  space       Space    @relation(fields: [spaceId], references: [id])
  
  historySpaceId String?
  historySpace   Space? @relation("SpaceHistory", fields: [historySpaceId], references: [id])

  userId      String
  user        User     @relation(fields: [userId], references: [id])
}
```

---

## 5. Mecanismo de Concurrencia: "Si reserva uno, los demás no pueden"

Para garantizar que si dos usuarios hacen clic en **"Reservar Ahora"** en el mismo milisegundo solo uno obtenga la reserva y el otro reciba un rechazo limpio (`409 Conflict`), se aplican **dos barreras técnicas**:

1. **Restricción `@unique` en Base de Datos (`spaceId` en `Reservation`):** PostgreSQL impide físicamente insertar una segunda reserva para el mismo `spaceId`.
2. **Transacción Atómica con Bloqueo Optimista (`updateMany` condicional):**

```typescript
// En POST /api/reservations
const result = await prisma.$transaction(async (tx) => {
  const now = new Date();

  // 1. Verificar el espacio
  const space = await tx.space.findUnique({
    where: { id: spaceId },
    include: { reservation: true }
  });

  if (!space) throw new ApiError(404, "Espacio no encontrado");
  if (space.hostId === currentUser.id) {
    throw new ApiError(403, "No puedes reservar tu propio espacio de coworking");
  }
  if (space.status !== "AVAILABLE" || space.expiresAt <= now || space.reservation) {
    throw new ApiError(409, "Este espacio ya fue reservado por otra persona o no está disponible");
  }

  // 2. Actualización atómica condicional (solo actualiza si sigue AVAILABLE)
  const updated = await tx.space.updateMany({
    where: {
      id: spaceId,
      status: "AVAILABLE",
      expiresAt: { gt: now },
    },
    data: {
      status: "RESERVED",
    },
  });

  // Si count es 0, otro usuario ganó la carrera en este milisegundo
  if (updated.count === 0) {
    throw new ApiError(409, "Otro usuario acaba de reservar este espacio hace un instante");
  }

  // 3. Crear el registro de reserva exclusiva
  return await tx.reservation.create({
    data: {
      spaceId,
      userId: currentUser.id,
      totalAmount: Number(space.price) + Number(space.serviceFee),
    },
  });
});
```

---

## 6. Estructura de Carpetas y Rutas (Next.js 16 App Router)

```text
src/
├── app/
│   ├── (public)/                        # Layout público: Navbar + Selector Idioma + Footer
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Home (SSG)
│   │   └── spaces/
│   │       ├── page.tsx                 # Catálogo de espacios con filtros (SSR)
│   │       └── [id]/
│   │           └── page.tsx             # Detalle del espacio + Cuenta regresiva + Botón Reserva (SSR)
│   ├── (auth)/                          # Layout centrado y minimalista
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (private)/                       # Layout privado: Navbar con menú de usuario
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Mis espacios publicados y Mis reservas realizadas (CSR)
│   │   └── spaces/
│   │       ├── new/page.tsx             # Publicar nuevo espacio de coworking
│   │       └── [id]/edit/page.tsx       # Editar espacio (solo si está libre)
│   ├── (admin)/                         # Layout exclusivo de Panel de Administración
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx                 # Moderación de espacios (cancelar con motivo)
│   │       └── categories/page.tsx      # CRUD de categorías de coworking
│   ├── api/                             # Route Handlers Fullstack
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   └── logout/route.ts
│   │   ├── spaces/
│   │   │   ├── route.ts                 # GET (listar con filtros), POST (crear máx 5 activos)
│   │   │   └── [id]/
│   │   │       ├── route.ts             # GET (detalle), PATCH (editar si no tiene reserva)
│   │   │       └── cancel/route.ts      # POST (cancelar por anfitrión si no tiene reserva)
│   │   ├── reservations/
│   │   │   ├── route.ts                 # POST (reservar y bloquear), GET (mis reservas)
│   │   │   └── space/[id]/route.ts      # GET (estado/historial público con alias parcial)
│   │   ├── categories/
│   │   │   ├── route.ts                 # GET (público), POST (admin)
│   │   │   └── [id]/route.ts            # PATCH (admin), DELETE (admin - falla si tiene espacios)
│   │   └── admin/
│   │       └── spaces/[id]/cancel/route.ts # POST (cancelar cualquier espacio con motivo obligatorio)
│   ├── layout.tsx                       # Root Layout (Providers de Auth e i18n)
│   └── globals.css                      # Estilos globales Tailwind v4 (tema oscuro PlanCity)
├── components/
│   ├── ui/                              # Botones, Inputs, Badges, Modales
│   ├── layout/                          # PublicNavbar, PrivateNavbar, AdminSidebar, Footer
│   └── spaces/
│       ├── SpaceCard.tsx                # Con next/image
│       ├── CountdownTimer.tsx           # Client Component libre de errores de hidratación
│       └── ReserveButton.tsx            # Manejo de estados de carga y error 409
├── context/
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx              # Soporte ES / EN
├── lib/
│   ├── prisma.ts                        # Singleton de PrismaClient
│   ├── jwt.ts                           # Firma y verificación de Access y Refresh Tokens
│   ├── auth-cookies.ts                  # Lectura/escritura de cookies httpOnly
│   └── space-status.ts                  # Función pura para resolver estado real (AVAILABLE vs EXPIRED)
├── proxy.ts                             # Protección de rutas (private) y (admin)
└── prisma/
    ├── schema.prisma
    ├── migrations/
    └── seed.ts                          # Crea Admin, Categorías y Espacios en los 4 estados
```

---

## 7. Plan de Ejecución Paso a Paso

### Fase 1: Base de Datos, Prisma y Semilla (`seed.ts`)
1. Instalar Prisma (`prisma`, `@prisma/client`) y configurar la conexión a **Supabase** en `.env` y `.env.example`.
2. Ejecutar la migración inicial con los modelos `User`, `Category`, `Space` y `Reservation`.
3. Crear `prisma/seed.ts` que genere:
   * Usuario **Administrador** con credenciales documentadas en el `README.md`.
   * Usuarios de prueba (anfitriones y clientes).
   * Categorías de Coworking (*Sala de Juntas*, *Oficina Privada*, *Hot Desk*, *Cabina Podcast*).
   * Espacios de ejemplo en los **4 estados**: `AVAILABLE` (disponibles para reservar), `RESERVED` (bloqueados por un usuario), `EXPIRED` (desiertos por tiempo vencido) y `CANCELLED` (con motivo de moderación).

### Fase 2: Seguridad, Autenticación Doble Token y `proxy.ts`
1. Implementar utilidades con `jose` o `jsonwebtoken` y `bcryptjs`.
2. Configurar los Route Handlers `/api/auth/*` enviando `accessToken` (15m) y `refreshToken` (7d) exclusivamente por cookies `httpOnly`, `secure`, `sameSite="lax"`.
3. Guardar el hash del `refreshToken` en la tabla `User` y revocarlo en `/api/auth/logout`.
4. Reemplazar el antiguo `middleware.ts` por `proxy.ts` verificando sesión en rutas `(private)` y rol `ADMIN` en `(admin)`.

### Fase 3: Route Handlers y Reglas de Negocio
1. Implementar la función `resolveSpaceStatus(space)` para que si un espacio `AVAILABLE` ya superó su `expiresAt`, se devuelva y trate automáticamente como `EXPIRED` (`Desierto`) sin usar cronjobs.
2. Construir los endpoints de espacios validando el máximo de 5 espacios activos por anfitrión y la ventana de tiempo de 1h a 7 días.
3. Construir el endpoint transaccional `/api/reservations` que bloquea el espacio al primer usuario que reserve y devuelve `409 Conflict` a cualquier intento posterior.
4. Construir los endpoints de administración para categorías (impidiendo borrar si tienen espacios asociados) y moderación con motivo obligatorio.

### Fase 4: Refactorización del Frontend de PlanCity, Renderizado e i18n
1. Reorganizar las vistas existentes de PlanCity dentro de los 4 route groups: `(public)`, `(auth)`, `(private)` y `(admin)`, cada uno con su propio `layout.tsx`.
2. Aplicar **SSG** en `app/(public)/page.tsx`, **SSR** (`dynamic = 'force-dynamic'`) en catálogo y detalle `/spaces/[id]`, y **CSR** (`'use client'`) en el dashboard del usuario.
3. Implementar `CountdownTimer.tsx` usando `useEffect` y estado de montaje (`mounted`) para evitar cualquier error de hidratación entre servidor y cliente.
4. Asegurar que todas las imágenes de los espacios utilicen el componente `<Image />` de `next/image`.
5. Añadir el diccionario Español/Inglés (`es` / `en`) y el selector de idioma en la barra de navegación.

### Fase 5: Docker, Documentación (`README.md`) y Despliegue
1. Crear `Dockerfile` multi-etapa con salida `standalone` de Next.js.
2. Redactar el `README.md` cumpliendo los 9 puntos exigidos en la rúbrica (descripción, requisitos, explicación de cada variable del `.env.example`, comandos exactos en orden, credenciales del admin del seed, comandos de Docker, scripts, estructura y URL en Vercel).
3. Verificar compilación limpia de TypeScript (`tsc --noEmit` con cero `any`) y desplegar en **Vercel** conectado a **Supabase**.