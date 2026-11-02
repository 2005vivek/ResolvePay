# ⚡ ResolvePay – Autonomous PayPal Dispute Defense Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Engine-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> **ResolvePay** is an enterprise-grade dispute resolution engine engineered to automate, defend, and settle merchant PayPal disputes using Google Gemini Generative AI and automated evidence aggregation.

---

## 🚀 The Problem & The Solution

| The Traditional Headache 🛑 | The ResolvePay Advantage ⚡ |
|---|---|
| Manual dispute tracking across scattered dashboards | **Centralized Real-Time Sync** via PayPal Dispute APIs & Webhooks |
| High merchant loss rates due to missed response deadlines | **Automated SLA Countdown** & urgency-based queue prioritization |
| Hours spent manually drafting legal rebuttals and gathering invoices | **Instant Gemini AI Rebuttal Generation** backed by extracted transaction facts |
| Inconsistent evidence formats leading to auto-rejections | **Structured Evidence Ingestion & Verification** with SHA-256 integrity checks |
| Fragmented merchant operations without audit trails | **Strict Tenant Isolation, Outbox Pattern, & Tamper-Evident Audit Logs** |

---

## 🏛️ System Architecture

```
                  ┌────────────────────────────────────────┐
                  │          Frontend Applications         │
                  ├───────────────────┬────────────────────┤
                  │   Next.js 14 Web  │ React + Vite Grid  │
                  │ (Executive Console│  (Classic Table)   │
                  │   & Mobile PWA)   │                    │
                  └─────────┬─────────┴─────────┬──────────┘
                            │                   │
                  REST / JSON (Bearer Auth + Tenant ID)
                            │                   │
                            ▼                   ▼
                  ┌────────────────────────────────────────┐
                  │       ResolvePay Spring Boot API       │
                  │             (Port :8085)               │
                  ├────────────────────────────────────────┤
                  │  • DisputeController & HealthMonitor   │
                  │  • Multi-Tenant Merchant Security      │
                  │  • Webhook Inbox / Outbox Event Relay  │
                  │  • Audit Logging Engine                │
                  └─────────┬───────────────────┬──────────┘
                            │                   │
             JPA / Hibernate│                   │Spring AI
             Flyway Schema  │                   │REST Client
                            ▼                   ▼
                  ┌──────────────────┐ ┌──────────────────┐
                  │ PostgreSQL 16/18 │ │  Google Gemini   │
                  │ (Disputes, Facts,│ │ (Flash-Lite LLM  │
                  │  Drafts, Outbox) │ │ Rebuttal Engine) │
                  └──────────────────┘ └──────────────────┘
```

---

## ✨ Key Features

### 🧠 1. AI Dispute Defense Agent (Google Gemini)
- Integrated with **Google Gemini (`gemini-3.5-flash-lite`)** via Spring AI.
- Analyzes dispute reason codes (`MERCHANDISE_OR_SERVICE_NOT_RECEIVED`, `UNAUTHORISED`, etc.), transaction history, and tracking details.
- Synthesizes compelling, evidence-backed rebuttal drafts formatted to PayPal compliance standards in seconds.

### 🏢 2. Multi-Tenant Merchant Isolation
- Built-in multi-tenant architecture with `X-Merchant-Id` context scoping.
- Cryptographically secure API token validation (`rzp_live_sec_...`).
- Strictly isolated database queries preventing cross-tenant data leaks.

### 🔄 3. Webhook Inbox & Transactional Outbox Pattern
- Guarantees exactly-once processing for incoming PayPal webhook events.
- Decouples background event publishing from core transactions using an event outbox worker.

### 🎨 4. Executive Dark Mode Experience (Next.js & PWA)
- Custom high-contrast theme built with **Graphite and Amber** (`#101010`, `#181818`, `#2A2A2A`, `#F5A524`).
- Interactive dispute drawer, real-time status updates, haptic feedback, and toast notification system.
- Full **Progressive Web App (PWA)** offline service worker support with responsive mobile views.

---

## 📂 Project Structure

```bash
ResolvePay/
├── src/                          # Spring Boot 4.1.1 Backend
│   ├── main/java/com/resolvepay/api/
│   │   ├── client/               # PayPal REST Sandbox Client
│   │   ├── config/               # Security, DB, Seeder & Web Mappings
│   │   ├── controller/           # REST Endpoints (/api/disputes, /api/health)
│   │   ├── model/                # JPA Entities (Dispute, Draft, Evidence, Audit)
│   │   ├── repository/           # Spring Data Repositories
│   │   ├── security/             # Merchant Auth Filter & Context Holder
│   │   └── service/              # DisputeService, AiDraftService, WebhookService
│   └── main/resources/
│       ├── db/migration/         # Flyway Schema Migrations (V1 to V4)
│       └── application.yaml      # Configuration & Fallback Defaults
├── web/                          # Modern Next.js 14 App Router Dashboard
│   ├── src/app/                  # Layouts, Global Styles & Interactive Page
│   ├── src/components/           # DisputeDrawer, Modals, Toasts
│   └── public/                   # PWA Manifest, Icons & Service Worker
├── client/                       # Classic React + Vite + AG-Grid Admin Table
├── mobile/                       # React Native / Expo Mobile App
├── Dockerfile                    # Containerization Spec
├── pom.xml                       # Maven Configuration (Java 17/21)
└── README.md                     # Platform Documentation
```

---

## 🛠️ Quick Start Guide (Local Setup)

### Prerequisites
- **Java**: JDK 17 or JDK 21+
- **Node.js**: v18+ (Node 20 or 24 recommended)
- **Database**: PostgreSQL 16+ (Local or Cloud instance e.g., Supabase / Neon)

---

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

Set your configuration in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resolvepay
DB_USER=postgres
DB_PASS=your_postgres_password

# Google Gemini API Key (for rebuttal draft generation)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite

# PayPal Sandbox Credentials (optional for simulation mode)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

---

### Step 2: Initialize Database
Create the database in PostgreSQL:
```sql
CREATE DATABASE resolvepay;
```
*(Flyway will automatically run all migrations on backend launch).*

---

### Step 3: Run Spring Boot Backend
```bash
# Windows
.\start-backend.cmd
# or via Maven Wrapper
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```
👉 Backend REST API will start on **`http://localhost:8085`**.  
Check health status at **`http://localhost:8085/api/health`**.

---

### Step 4: Run Frontend Dashboard

#### Option A: Modern Executive Dashboard (Next.js - Recommended)
```bash
cd web
npm install
npm run dev
```
👉 Open **`http://localhost:3000`** in your browser.

#### Option B: Classic AG-Grid Table (React + Vite)
```bash
cd client
npm install
npm run dev
```
👉 Open **`http://localhost:5173`** in your browser.

---

## 🧪 Simulation & Testing
ResolvePay includes an autonomous fallback seeder:
- If PayPal live credentials are not supplied, the backend seamlessly operates in **Simulation Mode** (`RESOLVEPAY_SIMULATION_ENABLED=true`), populating realistic dispute scenarios with live Gemini draft generation for end-to-end testing without billable API charges.

---

## 👤 Author & Credits

- **Repository**: [jeetjajal/paypal](https://github.com/jeetjajal/paypal)
- **Developer**: [Jeet Jajal](https://github.com/jeetjajal)
- **Original Base**: [2005vivek/ResolvePay](https://github.com/2005vivek/ResolvePay)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
