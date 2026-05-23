# GestionMonetaria

Aplicación web para la gestión financiera del hogar. Dashboard, control de gastos/ingresos,
presupuestos, cuentas pendientes, suscripciones, ahorros y detección de gastos hormiga.

## Stack

| Capa         | Tecnología                                   |
|-------------|----------------------------------------------|
| Frontend    | Next.js 16, React 19, Bootstrap 5, Chart.js |
| Backend     | Next.js (proxy.ts)                          |
| Base datos  | PostgreSQL vía Supabase                      |
| Auth        | Supabase Auth (email/password)              |
| Storage     | Supabase Storage (recibos)                  |
| Infra       | Docker (Supabase local), nginx, systemd     |

## Arquitectura

Hexagonal (puertos y adaptadores):

```
src/
├── domain/          # Entidades y lógica de negocio
├── application/     # Puertos (interfaces de repositorio)
├── infrastructure/  # Adaptadores (Supabase, etc.)
├── web/             # Componentes UI reutilizables
└── app/             # Páginas Next.js (App Router)
```

## Funcionalidades

- **Dashboard** — resumen ingresos/gastos/balance, evolución mensual y diaria,
  gráfico por categorías, métodos de pago, alertas de presupuesto, proyección
  de gastos hormiga.
- **Gastos** — registro, filtros por fecha/categoría, paginación, detección automática
  de gastos hormiga.
- **Ingresos** — registro y listado con totales.
- **Presupuestos** — límites por categoría con seguimiento de porcentaje.
- **Cuentas pendientes** — vencimientos y control de pago.
- **Suscripciones** — control de pagos mensuales/anuales.
- **Miembros** — invitación y gestión del hogar compartido.
- **Ahorros** — meta de ahorro mensual con seguimiento visual.

## Requisitos

- Docker + Docker Compose
- Node.js 22+
- Git
- (Opcional) Dominio con DNS apuntando al servidor

## Desarrollo local

```bash
# 1. Clonar
git clone git@github.com:Gakuus/GestionMonetaria.git
cd GestionMonetaria

# 2. Iniciar Supabase (Docker)
cd supabase
docker compose up -d
cd ..

# 3. Crear .env.local
cp .env.example .env.local
# Editar: NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
# y NEXT_PUBLIC_SUPABASE_ANON_KEY con el anon key de Supabase

# 4. Instalar y correr
npm install
npm run dev
```

## Deploy a servidor

```bash
git clone git@github.com:Gakuus/GestionMonetaria.git
cd GestionMonetaria
cp deploy/.env.production.example deploy/.env.production
# Editar deploy/.env.production con las keys de Supabase
nano deploy/config.yml   # Poner dominio, repo, etc.
sudo ./deploy/bootstrap.sh
```

Ver `deploy/` para documentación detallada de cada paso.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública de Supabase |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app |
| `NEXT_PUBLIC_ANT_EXPENSE_THRESHOLD` | Monto mínimo para gasto hormiga |
| `NEXT_PUBLIC_STORAGE_BUCKET_RECEIPTS` | Bucket de Storage |

## Licencia

MIT
