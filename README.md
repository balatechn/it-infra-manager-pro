# IT Infra Manager Pro

A comprehensive, production-ready IT Infrastructure Management Web Application for managing Software Licenses, Renewals, Subscriptions, AMC Contracts, Assets, Vendors, SNMP Monitoring, and Tickets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | PostgreSQL (Neon / Supabase recommended) |
| Charts | Recharts |
| Auth | JWT (Access + Refresh tokens), RBAC |
| Icons | Lucide React |
| Export | ExcelJS, PDFKit |

## Features

- **Unified Expense Module** — Software licenses, renewals, subscriptions, AMC contracts in one place
- **Dashboard** — 9 stat widgets + 4 interactive charts
- **Asset Management** — Track hardware and software assets
- **SNMP Monitoring** — Network device management with polling
- **Vendor Management** — Vendor profiles with cost analysis
- **Ticket Management** — Raise and track IT support tickets
- **Reports & Analytics** — 6 report types with Excel/PDF export
- **Settings** — User management, roles, master data, audit logs
- **Security** — AES-256 license key encryption, JWT authentication
- **Dark Mode** — Full light/dark theme toggle

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud — [Neon](https://neon.tech) recommended)

### 1. Clone & Install

```bash
git clone https://github.com/balatechn/it-infra-manager-pro.git
cd it-infra-manager-pro
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database URL and secrets.

### 3. Database Setup

```bash
npm run migrate   # Create tables and indexes
npm run seed      # Seed roles, admin user, master data
```

### 4. Start Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### Default Login
- **Email:** admin@itinfra.com
- **Password:** Admin@123

## Deploy on Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Required Environment Variables

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string with SSL |
| `JWT_SECRET` | JWT signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) |
| `ENCRYPTION_KEY` | 64-char hex for AES-256 encryption |
| `ENCRYPTION_IV` | 32-char hex initialization vector |

## Project Structure

```
src/
├── app/
│   ├── api/              # Next.js API route handlers
│   │   ├── auth/         # Login, refresh, profile
│   │   ├── dashboard/    # Stats, trends, forecasts
│   │   ├── assets/       # Asset CRUD
│   │   ├── expenses/     # Expense CRUD, renewals, calendar
│   │   ├── vendors/      # Vendor CRUD
│   │   ├── snmp/         # SNMP device management
│   │   ├── tickets/      # Ticket CRUD
│   │   ├── reports/      # Report generation & export
│   │   └── settings/     # Users, roles, masters, audit logs
│   ├── (dashboard)/      # Dashboard layout pages
│   └── login/            # Login page
├── components/           # React components
├── hooks/                # Custom React hooks
├── lib/                  # Shared libraries
│   ├── api.ts            # Frontend API client
│   ├── db.ts             # PostgreSQL connection pool
│   ├── auth.ts           # JWT & auth utilities
│   └── server-utils.ts   # Encryption, helpers
└── types/                # TypeScript type definitions
scripts/
├── migrate.mjs           # Database migration script
└── seed.mjs              # Database seed script
```

## User Roles

| Role | Access |
|------|--------|
| Super Admin | Full access to everything |
| IT Manager | All modules except user management |
| IT Engineer | Assets, expenses, tickets, SNMP |
| Finance View | Expenses (read-only), reports |
| Read Only | Dashboard and read-only views |

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth/*` |
| Dashboard | `/api/dashboard/*` |
| Assets | `/api/assets/*` |
| Expenses | `/api/expenses/*` |
| Vendors | `/api/vendors/*` |
| SNMP | `/api/snmp/*` |
| Tickets | `/api/tickets/*` |
| Reports | `/api/reports/*` |
| Settings | `/api/settings/*` |

## License

MIT
