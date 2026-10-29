# ResolvePay – PayPal Dispute Resolution Dashboard

## What is ResolvePay?
ResolvePay is an end‑to‑end web application that helps merchants handle PayPal disputes efficiently. It provides a clean React UI for browsing disputes, automatically generates a resolution draft using Google Gemini, and lets the user review and submit the response to PayPal.

## Why does it exist?
PayPal dispute handling is often manual, time‑consuming, and error‑prone. ResolvePay streamlines the workflow by:
- Pulling disputes from a PostgreSQL store.
- Using Gemini to suggest a professional email draft.
- Allowing the merchant to edit, approve, and submit the response in one place.

## Quick start (local development)
```bash
# 1. Clone the repo (if you haven't already)
git clone <repo‑url>
cd api

# 2. Set up environment variables (create a .env file in the backend root)
#    Example content (do NOT commit this file):
#    GEMINI_API_KEY=your‑gemini‑key
#    SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/resolvepay
#    SPRING_DATASOURCE_USERNAME=postgres
#    SPRING_DATASOURCE_PASSWORD=secret

# 3. Start PostgreSQL (Docker example)
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16

# 4. Build and run the Spring Boot backend
./mvnw spring-boot:run   # runs on http://localhost:8080

# 5. In another terminal, start the React front‑end
cd client
npm install
npm run dev              # Vite dev server on http://localhost:5173
```

The UI will be available at `http://localhost:5173`. Click a dispute row → *Generate Response with Gemini* → review the draft → *Submit to PayPal*.

## Key features (as of now)
- **Dispute listing** – paginated grid powered by AG‑Grid.
- **AI‑draft generation** – Spring AI integration with Gemini `gemini-3.5-flash-lite` (fallback to `gemini-3.1-flash-lite`).
- **Robust error handling** – global exception handler, validation of incoming JSON, and user‑friendly messages in the UI.
- **Improved performance** – Axios timeout increased to 120 seconds, backend timeouts tuned.
- **Audit logging** – every draft creation and submission is recorded for traceability.

## License
[MIT License](LICENSE)
