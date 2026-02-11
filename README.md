# BeLive FlowOffice - Frontend

> Modern HR Management System Frontend built with Next.js, integrated with Lark, Laravel, and Supabase

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** 8+
- **Git**

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Belive-FO-Client

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

---

## 📦 Tech Stack

### Core
- **Next.js 16+** - React framework with App Router
- **React 19.2** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

### State Management
- **TanStack Query** - Server state management
- **Zustand** - Client state management

### Forms & Validation
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### UI Components
- **shadcn/ui** - Accessible component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library

### Backend Integration
- **Supabase Client** - Database & Realtime
- **Axios** - HTTP client
- **Lark SDK** - Enterprise OAuth & native features

### Build Tools
- **pnpm** - Fast package manager
- **Turborepo** - Build caching

---

## 📁 Project Structure

```
belive-fo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public routes (login, etc.)
│   │   │   └── login/         # Login page with Lark OAuth
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Shared UI components
│   │   ├── shared/           # App-specific components (FullLogo, etc.)
│   │   └── ui/               # shadcn/ui components
│   ├── features/             # Feature modules
│   │   ├── attendance/       # Attendance management (planned)
│   │   ├── leave/            # Leave requests (planned)
│   │   ├── claims/           # Expense claims (planned)
│   │   └── lark-sdk/         # Lark integration (planned)
│   ├── shared/               # Shared utilities
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions (API clients, event bus, etc.)
│   │   ├── stores/           # Zustand stores (auth, UI)
│   │   └── types/            # TypeScript types
│   └── lib/                  # Core utilities (utils.ts)
├── public/                    # Static assets
│   └── images/               # Images (logos, backgrounds, icons)
├── docs/                      # Documentation
└── package.json
```

> **Note:** The `(authenticated)` route group is planned but not yet implemented. Currently, only the public login page exists.

---

## 🛠️ Available Scripts

```bash
# Development
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Utilities
pnpm clean        # Remove build artifacts & node_modules
pnpm format       # Format code with Prettier
```

---

## 🔑 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_SUPABASE_SECRET=your-supabase-service-role-key
NEXT_SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Laravel API
NEXT_PUBLIC_LARAVEL_API_URL=your-laravel-api-url
BFF_INTERNAL_SECRET=your-internal-secret

# Lark OAuth
NEXT_PUBLIC_LARK_APP_ID=your-lark-app-id
NEXT_PUBLIC_LARK_REDIRECT_URI=your-redirect-uri
```

---

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](./docs) folder:

- **[System Overview](./docs/01-overview.md)** - Complete integration architecture (Lark + Laravel + Supabase)
- **[Implementation Plan](./docs/02-implementation-plan.md)** - Step-by-step implementation guide
- **[Complete Guide](./docs/03-complete-guide.md)** - Comprehensive tech stack and implementation details

👉 **[Browse all documentation](./docs/README.md)**

---

## 🏗️ Key Features

- ✅ **Lark OAuth** - Enterprise SSO authentication
- ✅ **Real-time Updates** - Supabase Realtime subscriptions
- ✅ **Attendance Tracking** - GPS-based clock in/out with geofencing
- ✅ **Leave Management** - Request, approve, and track leave
- ✅ **Expense Claims** - Submit claims with receipt uploads
- ✅ **Dark Mode** - Built-in theme support
- ✅ **Type-safe** - Full TypeScript coverage
- ✅ **Responsive** - Mobile-first design

---

## 🔐 Authentication Flow

1. User clicks "Lark" button on login page
2. Redirected to Lark OAuth
3. Lark returns authorization code
4. Frontend exchanges code with Laravel API
5. Laravel validates and returns:
   - `api_token` (for Laravel API calls)
   - `supabase_token` (JWT for Supabase)
6. Tokens stored in Zustand store (persisted)
7. User redirected to dashboard (planned)

**Current Implementation:**
- Login page with Lark OAuth button and username/password form
- FullLogo component with FlowOffice branding and Lark icon
- SocialButtons component with Lark authentication
- AuthLogin component for traditional login (placeholder)

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Manual Build

```bash
# Build
pnpm build

# The output will be in .next/
# Serve with any Node.js server
pnpm start
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

[Your License Here]

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Lark/Feishu](https://www.larksuite.com/)

---

**Built with ❤️ by Your Team**

