# Alejandría UPC — Collaborative Academic Repository, Analytics & AI Study Platform

## Overview

**Alejandría** is a full-stack academic resource-sharing, study management, learning analytics, and AI-assisted learning platform built for the Systems Engineering community at **Universidad Popular del Cesar (UPC)**.

Students can organize **Study Repositories** by subject and semester, upload and preview academic documents, collaborate with classmates, follow peers and mutual friends, and turn repository materials into structured AI-generated quizzes, summaries, study guides, and slides. Administrators have access to global/advanced analytics dashboards and a full moderation workflow.

This repository hosts both the **Spring Boot REST API** (root) and the **React + Vite Frontend** (`frontend/`).

---

## Core Features

* **Authentication, Verification & Account Recovery:**
  * Institutional email registration (`@unicesar.edu.co`), BCrypt password hashing, and stateless **JWT (HS256)** authentication.
  * 6-digit **OTP email verification** with configurable expiration, attempt limits, and resend cooldown, supporting `console`, `smtp`, and `resend` mail providers.
  * Token-based password recovery and reset flow.
* **Academic Catalog & Study Repositories:**
  * Curriculum catalog covering faculties, academic programs, semesters (1–9), and subjects, plus personal subject-of-interest subscriptions.
  * Full CRUD for **Study Repositories** tagged by subject, semester, and topics, with likes, follows, and **collaborator invitations** (invite, accept/decline, remove).
* **Document Management:**
  * Upload, edit, delete, inline preview, and download academic files up to **25 MB** stored as Oracle BLOBs.
  * Strict extension and MIME validation supporting `PDF`, `DOC`, `DOCX`, `PPT`, `PPTX`, `XLS`, `XLSX`, `JPG`, `JPEG`, and `PNG`, plus topic normalization and paginated search/filtering.
* **Social Graph & Notifications:**
  * Public profiles, user search, follow/unfollow relationships, mutual **Friends** matching, and an in-app notification center (collaborator invites, new followers, mutual friend matches, AI shares, likes, new content, and moderation alerts).
* **AI Study Engine (Google Gemini):**
  * Generates structured study materials in four formats: **Quizzes** (`QUIZ`), **Summaries** (`SUMMARY`), **Study Guides** (`GUIDE`), and **Slides** (`SLIDES`), scoped to an entire repository, term, topic, or tag.
  * Uses **Google Gemini** (default `gemini-3.6-flash` with multi-model Flash/Flash-Lite fallback), reading repository metadata, text snippets, and inline PDFs.
  * Includes interactive quiz submission/grading, a configurable daily generation quota (`ai.daily-limit`, default `5`/day), a personal **My Study** saved library, and **AI material sharing exclusively between mutual friends**.
* **Learning Analytics & Statistics:**
  * Asynchronous interaction tracking (views, downloads, searches) with **SHA-256 + salt** anonymization, top-subject demand metrics, and CSV export.
  * Personal student statistics and **Admin Global & Advanced Analytics** endpoints visualized with Recharts in the frontend.
* **Governance & Moderation:**
  * Community reporting for `DOCUMENT`, `REPOSITORY`, and `PROFILE` targets with structured reasons (`ACTIVE_EXAM`, `PLAGIARISM`, `INAPPROPRIATE_CONTENT`, `CORRUPTED_FILE`, `MISLABELED`, `DUPLICATE`, `OTHER`).
  * Admin moderation inbox supporting `KEEP`, `HIDE`, `REMOVE`, `WARN_USER`, and `SUSPEND_USER` actions, backed by audit logs, moderation decisions, and user sanctions, plus user suspension management.
* **Modern Frontend & Mock-First Mode:**
  * Built with React 19, Material UI (MUI v9), React Router v7, and Recharts, featuring Light/Dark themes, role-guarded admin routes, and a `VITE_USE_MOCK` toggle to run with local mock data or against the live backend.

---

## Tech Stack

**Backend (Root):**
* Java 17
* Spring Boot `3.4.13` (Web, Data JPA, Security, Validation, Mail)
* Oracle Database / Oracle Autonomous Database Cloud (`ojdbc11-production` `23.5.0.24.07` with Wallet support)
* H2 Database (in-memory Oracle compatibility mode for automated tests)
* Maven

**Frontend (`frontend/`):**
* React `19.2` & Vite `8.3`
* Material UI (`@mui/material` & `@mui/icons-material` `9.5`)
* React Router DOM `7.18`
* Axios `1.20`
* Recharts `3.10`

**External Integrations:**
* Google Gemini API (Generative AI)
* SMTP / Resend HTTP API (Transactional Email)

---

## Project Structure & Architecture

```text
AlejandriaUPC/
├── pom.xml                                  # Maven configuration (Spring Boot 3.4.13, Java 17)
├── src/
│   ├── main/java/com/backend/
│   │   ├── config/                          # CORS, Security, RestTemplate, Mail & Verification properties
│   │   ├── controller/                      # REST controllers (/api/**)
│   │   ├── service/                         # Business rules, AI client, JWT, email, analytics, moderation
│   │   ├── repository/                      # Spring Data JPA repositories
│   │   ├── domain/                          # JPA entities (academy, ai, analytic, governance, identity, repos)
│   │   ├── dto/                             # Request & response DTOs
│   │   ├── cross/                           # Shared domain enums (AiContentType, ReportReason, etc.)
│   │   └── exception/                       # GlobalExceptionHandler & custom exceptions
│   ├── main/resources/
│   │   ├── application.properties           # Default configuration & env-var placeholders
│   │   └── application-local.properties.example
│   └── test/                                # Unit & integration tests (H2 Oracle mode)
├── frontend/
│   ├── package.json                         # Frontend scripts & dependencies
│   ├── vite.config.js                       # Vite dev server with /api -> localhost:8080 proxy
│   ├── .env.example                         # Frontend environment template
│   └── src/
│       ├── components/                      # Reusable UI components (layout, forms, AI, documents, admin)
│       ├── context/                         # AuthProvider & ThemeModeProvider
│       ├── mocks/                           # Mock datasets & in-memory mock store
│       ├── pages/                           # Views (auth, home, repositories, documents, ai, admin, profile, stats)
│       ├── routes/                          # Role-aware ProtectedRoute
│       ├── services/                        # Axios client & domain service modules
│       ├── theme/                           # MUI Light/Dark theme definitions
│       └── utils/                           # Validation, formatting, topics, and chart helpers
└── docs/                                    # Architecture diagrams, backlogs & AI usage logs
```

---

## Prerequisites

* **Java 17+** and **Maven**
* **Node.js 18+** and **npm**
* **Oracle Database** (Oracle Autonomous Database Cloud with Wallet or local Oracle XE; `spring.jpa.hibernate.ddl-auto=validate` expects the schema to exist beforehand)
* **Google AI Studio API Key** (required only for live AI generation features)

---

## Setup & Running Locally

### 1. Backend Configuration

`src/main/resources/application.properties` automatically imports an optional gitignored file `src/main/resources/application-local.properties` and also supports environment variables.

Copy the example file and fill in your credentials (never commit `application-local.properties`):

```bash
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
```

Key properties / environment variables:

```properties
# Oracle Database (example for Autonomous DB Wallet or local XE)
spring.datasource.url=jdbc:oracle:thin:@alejandriabd2026_high?TNS_ADMIN=C:/oracle/Wallet_AlejandriaBD2026
spring.datasource.username=alejandria
spring.datasource.password=your_database_password

# Security & CORS
jwt.secret=your_jwt_secret
jwt.expiration=86400000
cors.allowed.origins=http://localhost:5173

# Transactional Mail: console | smtp | resend
app.mail.provider=console
app.mail.from=Alejandria UPC <noreply@alejandria.local>
# For smtp: spring.mail.host, spring.mail.port, spring.mail.username, spring.mail.password
# For resend: app.mail.resend-api-key

# Google Gemini AI
ai.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=
ai.api.key=your_gemini_api_key
ai.daily-limit=5

# Analytics & Verification Secrets
analytics.salt=your_random_analytics_salt
app.verification.hash-secret=your_random_verification_secret
```

Run the backend API (defaults to `http://localhost:8080`):

```bash
mvn spring-boot:run
```

Run the backend test suite (uses in-memory H2 in Oracle mode with `src/test/resources/schema-test.sql`, no Oracle instance required):

```bash
mvn test
```

### 2. Frontend Setup (`frontend/`)

Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

Configure `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8080/api
# true = standalone mock data (src/mocks) | false = live Spring Boot API
VITE_USE_MOCK=false
VITE_MOCK_DELAY=400
```

> **Note:** When `VITE_USE_MOCK` is unset, it defaults to `true` so the UI can be previewed immediately without a running backend. Vite also proxies `/api` requests to `http://localhost:8080` during development.

Install dependencies and start the development server (defaults to `http://localhost:5173`):

```bash
npm install
npm run dev
```

Other frontend scripts:

```bash
npm run build   # Production bundle
npm run lint    # ESLint check
```

---

## API Endpoints Overview

| Module | Endpoints |
| :--- | :--- |
| **Auth** | `POST /api/auth/register`, `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`, `POST /api/auth/login`, `POST /api/auth/recover`, `POST /api/auth/reset` |
| **Catalog** | `GET /api/subjects`, `GET /api/subjects/{id}` *(also `/api/catalog/subjects`)* |
| **Users & Social** | `GET /api/users`, `GET /api/users/{username}`, `POST /api/users/{username}/follow`, `PUT /api/users/me`, `PUT /api/users/me/password`, `GET /api/users/me/friends`, `GET /api/users/me/following`, `GET /api/users/me/followers`, `GET/PUT /api/users/me/subjects`, `GET /api/users/me/collaborations`, `GET /api/users/me/statistics` |
| **Repositories** | `GET/POST /api/repositories`, `GET /api/repositories/followed`, `GET/PUT/DELETE /api/repositories/{id}`, `POST /api/repositories/{id}/like`, `POST /api/repositories/{id}/follow`, `GET /api/users/{username}/repositories` |
| **Collaborators** | `GET/POST /api/repositories/{id}/collaborators`, `POST /api/repositories/{id}/collaborators/respond`, `DELETE /api/repositories/{id}/collaborators/{username}` |
| **Documents** | `POST/GET /api/repositories/{repositoryId}/documents`, `GET /api/documents`, `GET /api/users/{username}/documents`, `GET/PUT/DELETE /api/documents/{id}`, `GET /api/documents/{id}/download`, `GET /api/documents/{id}/preview` |
| **AI Study** | `GET /api/ai/quota`, `POST /api/ai/quiz`, `GET /api/ai/quiz/{id}`, `POST /api/ai/quiz/{id}/submit`, `POST /api/ai/quiz/{id}/save`, `POST /api/ai/materials`, `GET /api/ai/materials/{id}`, `POST /api/ai/materials/{id}/save`, `GET /api/ai/my-study`, `DELETE /api/ai/my-study/{id}`, `GET/POST /api/ai/materials/{id}/share(s)`, `GET /api/ai/shared-with-me` |
| **Notifications** | `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all` |
| **Analytics** | `POST /api/analytics/interaction`, `GET /api/analytics/top-subjects`, `GET /api/analytics/export` |
| **Moderation & Admin** | `POST /api/reports`, `GET /api/admin/reports`, `GET /api/admin/reports/{id}`, `POST /api/admin/reports/{id}/resolve`, `GET /api/admin/users/{userId}`, `POST /api/admin/users/{userId}/toggle-suspension`, `GET /api/admin/statistics`, `GET /api/admin/statistics/advanced` |

---

## Team & Roles

* **José Daniel Pinzón Racero** — Technical Lead / Backend Developer (Architecture, Business Services, Auth & Verification, AI & Analytics Integration)
* **Pablo Andrés Amaya Pabón** — Backend Developer (Spring Data JPA Repositories, Domain Entities, Controllers, Exception Handling)
* **Sergio Alejandro Guerrero Espitia** — Frontend Developer & Full-Stack Integration (React, Vite, Material UI, Service Layer & Cloud Integration)
