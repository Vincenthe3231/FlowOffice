# BeLive FlowOffice - Documentation

> Comprehensive documentation for the BeLive FlowOffice frontend project

---

## 📚 Documentation Index

### Getting Started

Start with the main [README](../README.md) for quick setup and installation instructions.

---

### Architecture & Design

#### [01. System Overview](./01-overview.md) 📐
**Complete Integration Architecture: Lark + Laravel + Supabase**

Learn how all systems work together:
- 🔄 Full system architecture diagrams
- 🔐 Authentication flow (Lark OAuth → Laravel → Supabase JWT)
- 📱 Lark SDK integration (GPS, Camera, WiFi geofencing)
- 🚀 Laravel API structure and endpoints
- ⚡ Supabase Realtime subscriptions and RLS policies
- 💾 Storage integration and file uploads
- 🎯 Complete module implementations (Attendance, Leave, Claims)

**Read this first** to understand how everything connects.

---

### Implementation Guides

#### [02. Implementation Plan](./02-implementation-plan.md) 📋
**Step-by-Step Frontend Development Guide**

Phase-by-phase implementation strategy:
- 📦 Phase 1: Project setup and foundation
- 🔧 Phase 2: Authentication and middleware
- 🎨 Phase 3: Shared components and layouts
- 📊 Phase 4: Dashboard and navigation
- 👥 Phase 5-7: Feature modules (Attendance, Leave, Claims)
- ✅ Phase 8: Testing and deployment

**Use this** when building features systematically.

---

#### [03. Complete Guide](./03-complete-guide.md) 📖
**Comprehensive Tech Stack & Implementation Reference**

In-depth technical documentation:
- 🛠️ **Technology Decisions** - Why we chose each technology
- 🏗️ **Backend Dependencies** - Laravel packages and setup
- ⚛️ **Frontend Stack** - Next.js, React, and all dependencies
- 🔑 **Key Concepts** - RLS, JWT, Realtime subscriptions explained
- 📊 **Database Schema** - Complete table structures
- 🔌 **API Documentation** - All endpoints with examples
- 🧪 **Testing Patterns** - Backend and frontend testing
- 🚢 **Deployment** - Production setup guide

**Reference this** for detailed technical decisions and complete implementations.

---

## 🗂️ Quick Navigation

### By Topic

**Authentication & Security**
- [Overview: Authentication Flow](./01-overview.md#step-by-step-integration-setup)
- [Complete Guide: Key Concepts - JWT & RLS](./03-complete-guide.md#key-concepts-explained)

**Feature Modules**
- [Overview: Attendance Module](./01-overview.md#attendance-module-implementation)
- [Overview: Leave Module](./01-overview.md#leave-module-implementation)
- [Overview: Claims Module](./01-overview.md#claims-module-implementation)

**Lark Integration**
- [Overview: Lark SDK Setup](./01-overview.md#11-initialize-lark-sdk-in-nextjs)
- [Overview: GPS & Camera](./01-overview.md#step-2-use-lark-sdk-features)

**Database & API**
- [Complete Guide: Database Schema](./03-complete-guide.md#database-schema)
- [Complete Guide: API Endpoints](./03-complete-guide.md#api-documentation)

---

## 📝 Reading Recommendations

### For New Developers
1. Start with [../README.md](../README.md) for project setup
2. Read [01-overview.md](./01-overview.md) to understand the architecture
3. Follow [02-implementation-plan.md](./02-implementation-plan.md) phase by phase

### For Backend Developers
1. [03-complete-guide.md](./03-complete-guide.md) - Backend Dependencies section
2. [01-overview.md](./01-overview.md) - Laravel API structure

### For Frontend Developers
1. [02-implementation-plan.md](./02-implementation-plan.md) - Frontend implementation phases
2. [01-overview.md](./01-overview.md) - Frontend integration examples

### For DevOps/Deployment
1. [03-complete-guide.md](./03-complete-guide.md) - Deployment section
2. [01-overview.md](./01-overview.md) - Infrastructure setup

---

## 🔄 Document Maintenance

These documents are actively maintained. Last updated: **February 11, 2026**

For documentation issues or suggestions, please create an issue or pull request.

---

**Happy Coding! 🚀**


