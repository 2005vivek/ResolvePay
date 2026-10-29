# Architecture Overview

The ResolvePay system consists of four major components that communicate over HTTP.

```mermaid
flowchart LR
    subgraph Frontend[React Front‑end (Vite)]
        UI[User Interface]
    end
    subgraph Backend[Spring Boot API]
        API[REST Controllers]
        Service[Service Layer]
        AI[Gemini AI Integration]
        DB[PostgreSQL DB]
    end
    UI -->|GET /api/disputes| API
    UI -->|POST /api/disputes/{id}/draft| API
    UI -->|POST /api/disputes/{id}/submit| API
    API --> Service
    Service --> AI
    Service --> DB
    AI -->|Gemini API| Gemini[Google Gemini]
    DB -->|JPA/Hibernate| PostgreSQL[(PostgreSQL)]
```

**Data Flow**
1. **Listing disputes** – UI fetches a paginated list via `GET /api/disputes`. The controller queries the database and returns JSON.
2. **Draft generation** – UI posts to `POST /api/disputes/{id}/draft`. The backend service calls Gemini (primary model `gemini-3.5‑flash‑lite`, fallback `gemini-3.1‑flash‑lite`) to generate a draft, stores it, and returns the draft text.
3. **Submitting a response** – After the merchant reviews the draft, the UI calls `POST /api/disputes/{id}/submit`. The service updates the dispute status, logs the action, and (in a real integration) would call PayPal APIs.

The diagram above is rendered by GitHub/Markdown viewers that support Mermaid.

---
*All components are container‑friendly and can be run locally as described in the README.*