# Tech Stack

| Layer | Technology | Version | Reason for Choice |
|-------|------------|---------|-------------------|
| **Backend Language** | Java | 25 (preview) | Modern language features, strong ecosystem, long‑term support for enterprise apps |
| **Framework** | Spring Boot | 4.1.1 | Rapid microservice development, embedded server, auto‑configuration, excellent integration with Spring AI |
| **REST** | Spring MVC (part of Boot) | — | Simple annotation‑driven controllers |
| **Data Access** | Spring Data JPA + Hibernate | — | Declarative repository layer, automatic CRUD, DB‑agnostic mapping |
| **Database** | PostgreSQL | 16 | Reliable, ACID‑compliant, works well with Hibernate's dialect auto‑detection |
| **AI Integration** | Spring AI (Google Gemini) | 0.8.0 (approx) | Unified model‑agnostic AI client, easy to switch providers |
| **Front‑end** | React (JSX) + Vite | React 18, Vite 5 | Fast dev server, hot‑module replacement, modern build tooling |
| **UI Components** | AG‑Grid Community | 36.2.0 | Powerful data grid with pagination, row selection, validation modules |
| **HTTP Client (frontend)** | Axios | 1.7.2 | Promise‑based, supports timeout configuration |
| **Build Tool** | Maven (wrapper) | 3.9.6 | Consistent Java builds, dependency management |
| **Testing** | JUnit 5, Spring Test | — | Unit & integration testing for controller & service layers |
| **Boilerplate Reduction** | Lombok | 1.18.32 | Reduces getter/setter/constructor boilerplate |
| **Containerisation (optional)** | Docker | — | Easy local PostgreSQL setup, can be extended to containerise the whole stack |

All versions are defined in `pom.xml` and `package.json`. The stack balances enterprise‑grade backend stability with a lightweight, modern React UI.
