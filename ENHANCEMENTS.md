# Enhancements Roadmap

## Short‑term (next 2‑4 weeks)
- **Authentication & Authorization** – Add Spring Security with JWT so only authorized merchants can access disputes.
- **PayPal API Integration** – Replace the stubbed “submit” endpoint with real PayPal settlement calls.
- **Docker Compose** – Provide a `docker-compose.yml` that starts PostgreSQL, the backend, and the Vite dev server together.
- **CI/CD Pipeline** – GitHub Actions workflow for Maven build, unit tests, and linting of the React code.
- **Improved AI Prompting** – Fine‑tune Gemini prompts, add configurable `temperature` and `maxTokens`.

## Medium‑term (1‑2 months)
- **Multi‑model support** – Allow the user to select between Gemini, OpenAI, or Anthropic via a config flag.
- **Bulk draft generation** – Generate drafts for multiple selected disputes in parallel.
- **Audit UI** – Add a view that shows the history of drafts and submissions per dispute.
- **Internationalisation (i18n)** – Support multiple languages for the UI and AI prompts.

## Long‑term (3+ months)
- **Full PayPal webhook handling** – Receive PayPal dispute updates automatically.
- **Server‑side rendering (SSR) option** – Improve SEO and initial load performance.
- **Performance benchmarking** – Automated load tests to verify the 120 s timeout remains sufficient under heavy usage.
- **Plugin architecture** – Enable third‑party extensions (e.g., custom AI providers, analytics).

The roadmap is intentionally modular; each item can be tackled independently without breaking the existing workflow.
