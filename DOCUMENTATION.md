# 📚 ResolvePay – Comprehensive Technical & User Documentation

Welcome to the official technical and user guide for **ResolvePay**, an autonomous PayPal dispute defense platform powered by Google Gemini and real-time carrier telemetry.

---

## 📑 Table of Contents
1. [Platform Overview](#platform-overview)
2. [End-to-End System Workflow](#end-to-end-system-workflow)
3. [REST API Reference](#rest-api-reference)
4. [AI Forensic Evidence Shield](#ai-forensic-evidence-shield)
5. [Carrier Telemetry (POD) Integration](#carrier-telemetry-pod-integration)
6. [Meta WhatsApp 1-Tap Autopilot](#meta-whatsapp-1-tap-autopilot)
7. [Multi-Tenant Security & Store Partitioning](#multi-tenant-security--store-partitioning)
8. [Setup & Deployment Guide](#setup--deployment-guide)

---

## 1. Platform Overview
ResolvePay solves the multimillion-dollar merchant problem of PayPal chargebacks by converting manual, deadline-strained dispute filing into an autonomous, 1-tap operation.

- **Primary Goal**: Minimize revenue loss, avoid missed 10-day PayPal SLA deadlines, and eliminate manual legal brief drafting.
- **AI Core**: Google Gemini (`gemini-3.5-flash-lite` with fallback) via Spring AI.
- **Enterprise Architecture**: Spring Boot 3.3.4 (Java 17/21), Next.js 14, PostgreSQL (Neon Cloud), Meta WhatsApp Cloud API.

---

## 2. End-to-End System Workflow

```
[PayPal Buyer Dispute] ──► [PayPal Webhook Gateway]
                                    │
                                    ▼
                         [ResolvePay Spring Boot API]
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
[Carrier Telemetry Fetch]                            [AI Forensic Validation]
(FedEx, DHL, USPS, Shiprocket)                       (PayPal Receipt & POD Check)
         │                                                     │
         └──────────────────────────┬──────────────────────────┘
                                    │
                                    ▼
                         [Gemini AI Defense Engine]
                     (Multi-Lingual Legal Brief Draft)
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
[Next.js Executive Console]                           [WhatsApp 1-Tap Alert]
(Merchant reviews & submits)                          (Merchant defends on phone)
                                    │
                                    ▼
                    [PayPal REST API Submission]
                    (Outbox Event & Tamper Audit)
```

---

## 3. REST API Reference

Base URL: `https://resolvepay-api.onrender.com/api` (Local: `http://localhost:8085/api`)

### Health & Telemetry
```http
GET /api/health
```
- **Description**: Returns database connectivity, active service status, and current timestamp.
- **Response `200 OK`**:
```json
{
  "status": "UP",
  "service": "resolvepay-api",
  "database": "CONNECTED",
  "timestamp": "2026-11-10T06:30:00Z"
}
```

### Dispute Management
```http
GET /api/disputes?page=0&size=10
Header: X-Merchant-Id: merchant_jeet_jajal
```
- **Description**: Lists paginated disputes scoped strictly to the authenticated tenant.

```http
POST /api/disputes/{id}/draft
Header: X-Merchant-Id: merchant_jeet_jajal
```
- **Description**: Invokes Google Gemini to synthesize an evidence-grounded legal rebuttal based on transaction history and courier delivery scans.

```http
POST /api/disputes/{id}/submit
Header: X-Merchant-Id: merchant_jeet_jajal
```
- **Description**: Submits the final defense brief and certified proofs to the PayPal Disputes Sandbox API.

### Forensic Evidence Ingestion
```http
POST /api/disputes/{id}/evidence/upload
Header: X-Merchant-Id: merchant_jeet_jajal
Content-Type: multipart/form-data
```
- **Description**: Uploads a receipt or carrier proof. Runs AI forensic validation against PayPal-approved receipt specifications and checks for tampering.

---

## 4. AI Forensic Evidence Shield
To protect both merchants and payment networks against fraud, ResolvePay enforces strict document verification:
- **PayPal-Approved Formats**: Official carrier PODs, verified commercial invoices, and signed tracking slips.
- **Tampering Heuristics**: Autonomous forensic checks inspect metadata, SHA-256 signatures, and format consistency.
- **Automated Incident Reporting**: If an unapproved or doctored receipt is uploaded:
  1. The document is flagged `🚨 REJECTED (REPORTED TO PAYPAL)`.
  2. A tamper incident audit record is created (`REPORT_EVIDENCE_TAMPERING_TO_PAYPAL`).
  3. A formal security notification is dispatched to PayPal's Risk Gateway.

---

## 5. Carrier Telemetry (POD) Integration
ResolvePay unifies carrier data streams from major global logistics providers:
- **FedEx Express / Ground**: Real-time signature image extraction and geo-coordinates.
- **DHL Express**: Master AWB scan events and recipient identification.
- **USPS**: Electronic Proof of Delivery (e-POD) verification.
- **Shiprocket**: Domestic tracking milestones.

---

## 6. Meta WhatsApp 1-Tap Autopilot
Designed for merchants on the go:
1. When a dispute is filed on PayPal, ResolvePay sends a mobile alert to the merchant's registered WhatsApp number.
2. The interactive message contains:
   - Case ID & Amount at risk
   - Buyer claim reason
   - Verified carrier proof summary
3. The merchant taps **"1. Auto-Defend in PayPal"** directly inside WhatsApp.
4. The backend verifies the cryptographic webhook signature, transitions the case to `UNDER_REVIEW`, and posts the defense to PayPal within 2 seconds.

---

## 7. Multi-Tenant Security & Store Partitioning
- **Zero-Trust Token Auth**: Validates internal merchant tokens (`rzp_live_sec_...`).
- **ThreadLocal Scoping**: Every incoming HTTP request binds to a thread-isolated merchant context (`X-Merchant-Id`).
- **Data Partitioning**: All PostgreSQL database queries enforce `WHERE merchant_id = ?` filters to ensure zero data bleeding between distinct stores.

---

## 8. Setup & Deployment Guide

### Quick Start (Local Development)
```bash
# 1. Clone repository
git clone https://github.com/jeetjajal/paypal.git
cd paypal

# 2. Start Spring Boot Backend
./mvnw spring-boot:run

# 3. Start Next.js Frontend Console
cd web
npm install
npm run dev
```

### Production Deployments
- **Frontend**: Automatically deployed via Vercel Edge Network from GitHub branch `main`.
- **Backend**: Containerized with Docker and hosted on Render Cloud.
- **Database**: Serverless PostgreSQL hosted on Neon.

---

*Authored by Jeet Jajal & Vivek for the Hackathon Submission (2026).*
