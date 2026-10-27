# 🏢 PlanCity Coworking — Plataforma Fullstack de Reserva Exclusiva de Espacios

Plataforma web Fullstack desarrollada con **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM** y **PostgreSQL (Supabase)**. Implementa un sistema de reserva única e inmediata de espacios de coworking (salas de juntas, oficinas privadas, hot desks y cabinas acústicas) con control de concurrencia a nivel de base de datos (`409 Conflict`), doble autenticación JWT segura en cookies `httpOnly`, soporte multi-idioma (Español / Inglés) y panel administrativo para moderación.

---

## 📋 Requisitos Previos

- **Node.js**: v20.x o superior (probado en v24.x)
- **NPM**: v10.x o superior
- **Base de datos PostgreSQL**: Instancia en [Supabase](https://supabase.com) (o PostgreSQL local/remoto).
- **Docker** (Opcional, para ejecución en contenedor).

---

## 🔐 Configuración de Variables de Entorno (`.env.example`)

Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

A continuación se explica el propósito de cada variable requerida:

| Variable | Propósito | Ejemplo / Formato |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cadena de conexión con connection pooler (Transaction mode / PgBouncer, puerto 6543) para consultas de la aplicación. | `postgresql://postgres.[REF]:[PASS]@aws-1-...pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Conexión directa a PostgreSQL (puerto 5432) necesaria para que Prisma ejecute migraciones de esquema. | `postgresql://postgres.[REF]:[PASS]@aws-1-...pooler.supabase.com:5432/postgres` |
| `JWT_ACCESS_SECRET` | Clave secreta para firmar los Access Tokens (vida corta de 15 minutos). Mínimo 32 caracteres. | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET`| Clave secreta para firmar los Refresh Tokens (vida de 7 días). Mínimo 32 caracteres. | `openssl rand -base64 32` |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`). | `development` |
| `NEXT_PUBLIC_APP_URL` | URL base pública de la aplicación para enlaces y redirecciones. | `http://localhost:3000` |
| `ADMIN_NAME` | Nombre inicial del usuario Administrador generado por el seed. | `Administrador PlanCity` |
| `ADMIN_EMAIL` | Correo electrónico del Administrador para ingresar al sistema. | `admin@plancity.com` |
| `ADMIN_PASSWORD` | Contraseña asignada al Administrador en la siembra de datos. | `AdminPassword123!` |

---

## 🚀 Comandos de Instalación y Ejecución en Orden

### 1. Instalar dependencias
```bash
npm install
```

### 2. Generar el Cliente de Prisma y Sincronizar Base de Datos
```bash
npx prisma generate
npm run db:deploy  # o npx prisma db push
```

### 3. Poblar la Base de Datos con Datos de Prueba (Seed)
```bash
npm run db:seed
```

### 4. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 👤 Credenciales del Usuario Administrador y Cuentas de Prueba

Generadas automáticamente por `prisma/seed.ts`:

### Administrador (Acceso a `/admin` y Moderación):
- **Correo:** `admin@plancity.com`
- **Contraseña:** `AdminPassword123!`

### Anfitriones (Publicadores de Espacios):
- **Carlos:** `carlos@plancity.com` / `Password123!`
- **Elena:** `elena@plancity.com` / `Password123!`
- **Mateo:** `mateo@plancity.com` / `Password123!`

### Clientes / Reservantes:
- **Sofía:** `sofia@plancity.com` / `Password123!`
- **Andrés:** `andres@plancity.com` / `Password123!`

---

## 🐳 Comandos para Despliegue con Docker

### Construir la imagen:
```bash
docker build -t plancity-coworking .
```

### Ejecutar el contenedor:
```bash
docker run -p 3000:3000 --env-file .env plancity-coworking
```

---

## 📜 Scripts Disponibles (`package.json`)

- `npm run dev`: Inicia el servidor de desarrollo Next.js con Turbopack.
- `npm run build`: Compila el bundle de producción para despliegue.
- `npm run start`: Inicia el servidor compilado en producción.
- `npm run lint`: Ejecuta el análisis estático de código con ESLint.
- `npm run db:migrate`: Crea y aplica migraciones de base de datos interactivas.
- `npm run db:deploy`: Aplica migraciones pendientes en producción.
- `npm run db:seed`: Ejecuta la semilla `prisma/seed.ts` para poblar categorías, usuarios y espacios en los 4 estados.
- `npm run db:studio`: Abre la interfaz visual de Prisma Studio para inspeccionar las tablas.

---

## 📂 Estructura del Proyecto

```text
src/
├── app/
│   ├── (public)/          # Rutas públicas con Navbar, selector ES/EN y Footer
│   │   ├── page.tsx       # Home (SSG con revalidación periódica)
│   │   └── spaces/        # Catálogo y detalle [id] con SSR dinámico
│   ├── (auth)/            # Rutas de autenticación minimalistas (login, register)
│   ├── (private)/         # Rutas protegidas (dashboard del usuario, nuevo espacio, edición)
│   ├── (admin)/           # Panel de administración (moderación con motivo obligatorio y categorías)
│   ├── api/               # Route Handlers Fullstack (auth, spaces, reservations, categories, admin)
│   ├── layout.tsx         # RootLayout con Providers globales
│   └── globals.css        # Tailwind CSS
├── components/
│   ├── layout/            # PublicNavbar y Footer
│   └── spaces/            # SpaceCard, CountdownTimer y ReserveButton atómico
├── context/               # AuthContext y LanguageContext (i18n ES/EN)
├── lib/                   # prisma singleton, jwt, cookies seguras, cálculo de estados
├── proxy.ts               # Protección perimetral de rutas (private) y (admin)
└── prisma/
    ├── schema.prisma      # Modelos User, Category, Space, Reservation
    └── seed.ts            # Datos de prueba con los 4 estados oficiales
```

---

## 🌐 Enlace de Despliegue en Vercel
- **URL Producción:** [https://coworkingspace-zeta.vercel.app](https://coworkingspace-zeta.vercel.app)

