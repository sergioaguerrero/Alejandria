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
├── REQUIREMENTS.txt                         # Full Spanish setup, API keys & troubleshooting reference
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

Make sure the following tools are installed on your machine (see also `REQUIREMENTS.txt` for a complete Spanish reference):

* **Java JDK 17+**: Verify with `java -version`.
* **Apache Maven 3.8+**: Verify with `mvn -version`.
  > **Note:** This repository does **not** include a Maven wrapper (`mvnw` / `mvnw.cmd`). If `mvn` is not in your Windows `PATH`, you can run all Maven goals directly from IntelliJ IDEA's built-in **Maven** tool window.
* **Node.js 18+** (`20+` or `22+` recommended) & **npm**: Verify with `node -v` and `npm -v`.
* **Git** for version control.
* **Oracle Database** *(only required to run the live backend)*:
  * **Oracle Autonomous Database Cloud**: Download and extract your Wallet folder locally (e.g., `C:/oracle/Wallet_AlejandriaBD2026`).
  * Or a local **Oracle XE / Oracle DB** instance.
  * **Database-First mode:** `spring.jpa.hibernate.ddl-auto=validate` expects the database schema to exist beforehand.
  * **Automated tests (`mvn test`)** use an in-memory **H2** database in Oracle compatibility mode (`src/test/resources/schema-test.sql`), so **no Oracle instance is needed** to run tests.
* **Google AI Studio API Key** *(optional for boot, required only for live AI Study generation)*: Obtain one at [Google AI Studio](https://aistudio.google.com/apikey).

---

## Installation, Configuration & Running Locally

### 1. Clone the Repository

```bash
git clone <REPO_URL>
cd AlejandriaUPC
git checkout develop
git pull origin develop
```

---

### 2. Backend Configuration (`src/main/resources/application-local.properties`)

> **Security Rule:** Never commit credentials, passwords, API keys, or your Oracle Wallet to Git. Both `src/main/resources/application-local.properties` and `frontend/.env.local` are ignored in `.gitignore`.

`src/main/resources/application.properties` loads defaults first, automatically imports `application-local.properties` if present (`spring.config.import=optional:classpath:application-local.properties`), and supports OS environment variables as overrides.

Create your local config file from the template:

**Windows (PowerShell):**
```powershell
Copy-Item src/main/resources/application-local.properties.example src/main/resources/application-local.properties
```

**Git Bash / Linux / macOS:**
```bash
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
```

#### Backend Properties & Environment Variables Reference

##### A. Oracle Database *(Required for running the live backend)*
| Property | Environment Variable | Description / Example |
| :--- | :--- | :--- |
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` | JDBC URL with Wallet path (use `/` on Windows): `jdbc:oracle:thin:@alejandriabd2026_high?TNS_ADMIN=C:/oracle/Wallet_AlejandriaBD2026` |
| `spring.datasource.username` | `SPRING_DATASOURCE_USERNAME` | Oracle DB username (default: `alejandria`) |
| `spring.datasource.password` | `SPRING_DATASOURCE_PASSWORD` | Oracle DB password *(no default)* |

##### B. Google Gemini AI *(Required for `/api/ai/*` Study Engine)*
| Property | Environment Variable | Default / Description |
| :--- | :--- | :--- |
| `ai.api.key` | `AI_API_KEY` *(or `IA_API_KEY`)* | Google AI Studio key (`AIzaSy...`). If left empty, the backend starts normally but `/api/ai/*` returns HTTP `503` (`AI_NOT_CONFIGURED`). |
| `ai.api.url` | `AI_API_URL` | `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=` *(automatic fallback to `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`, and `gemini-flash-lite-latest`)* |
| `ai.daily-limit` | `AI_DAILY_LIMIT` | `5` (daily AI generations per user) |
| `ia.timeout` | `IA_TIMEOUT` | `60000` (HTTP timeout in ms) |

##### C. Transactional Email *(OTP verification & password recovery)*
| Property | Environment Variable | Description |
| :--- | :--- | :--- |
| `app.mail.provider` | `APP_MAIL_PROVIDER` | `console` \| `smtp` \| `resend` (default: `console`) |
| `app.mail.from` | `APP_MAIL_FROM` | Sender address (e.g., `Alejandria UPC <noreply@alejandria.local>`) |

Choose **one** mail provider in `application-local.properties`:
* **`console`** *(recommended for quick local dev)*: Prints 6-digit OTP codes and recovery links in the Spring Boot console prefixed with `[DEV-MAIL]`. No credentials needed.
* **`smtp`** *(real email via Gmail or SMTP server)*: Configure `spring.mail.host` (`MAIL_HOST`, e.g., `smtp.gmail.com`), `spring.mail.port` (`MAIL_PORT`, e.g., `587`), `spring.mail.username` (`MAIL_USERNAME`), and `spring.mail.password` (`MAIL_PASSWORD`). For Gmail, enable 2FA and use a **16-character App Password**—never your regular account password.
* **`resend`** *(HTTP API for cloud/production)*: Configure `app.mail.resend-api-key` (`RESEND_API_KEY`, format `re_xxxxxxxxx` from [Resend](https://resend.com/api-keys)) and `app.mail.resend-url` (`RESEND_API_URL`, default `https://api.resend.com/emails`).

##### D. Security, Verification, Analytics & Limits
| Property | Environment Variable | Default / Purpose |
| :--- | :--- | :--- |
| `jwt.secret` | `JWT_SECRET` | `alejandria-dev-jwt-secret-change-in-production` *(use a 32+ char random secret in production)* |
| `jwt.expiration` | `JWT_EXPIRATION` | `86400000` (24 hours in ms) |
| `app.verification.hash-secret` | `VERIFICATION_HASH_SECRET` | `alejandria-dev-verification-secret-change-in-prod` |
| `analytics.salt` | `ANALYTICS_SALT` | `alejandria_analytics_salt_key_2026` |
| `app.frontend.url` | — | `http://localhost:5173` (used to build password reset links) |
| `cors.allowed.origins` | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` (`SecurityConfig` also permits `http://localhost:*` and `http://127.0.0.1:*`) |
| `spring.servlet.multipart.max-file-size` | `FILE_MAX_SIZE` | `25MB` |
| `spring.servlet.multipart.max-request-size` | `FILE_MAX_REQUEST_SIZE` | `25MB` |

*(OTP verification parameters default to `code-length=6`, `expiration-minutes=15`, `max-attempts=5`, `resend-cooldown-seconds=60`, `unverified-cleanup-hours=48`.)*

---

### 3. Build, Test & Run the Backend (Port `8080`)

From the repository root (`AlejandriaUPC/`):

```bash
# Compile the backend
mvn clean compile

# Run unit and integration tests (uses H2 in-memory DB, no Oracle required)
mvn test

# Package executable JAR (outputs target/alejandria-1.0.0.jar)
mvn clean package
# Or skip tests: mvn clean package -DskipTests

# Start the Spring Boot API on http://localhost:8080
mvn spring-boot:run
# Or run the packaged JAR:
# java -jar target/alejandria-1.0.0.jar
```

---

### 4. Frontend Installation & Setup (`frontend/`, Port `5173`)

Create `frontend/.env.local` from `frontend/.env.example`:

**Windows (PowerShell):**
```powershell
cd frontend
Copy-Item .env.example .env.local
```

**Git Bash / Linux / macOS:**
```bash
cd frontend
cp .env.example .env.local
```

Configure `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8080/api
# false -> connects to the live Spring Boot API | true -> local mock data (src/mocks)
VITE_USE_MOCK=false
VITE_MOCK_DELAY=400
```

| Variable | Default (if unset) | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8080/api` | Spring Boot API base URL (no trailing `/`) |
| `VITE_USE_MOCK` | `true` | Set to `false` to use the real backend; when omitted, defaults to `true` for standalone UI preview |
| `VITE_MOCK_DELAY` | `400` | Simulated latency in ms when `VITE_USE_MOCK=true` |

> **Important:** Always restart `npm run dev` after editing `frontend/.env.local` so Vite reloads the environment variables.

Install dependencies and run the frontend:

```bash
npm install
npm run dev
```

Other useful frontend scripts (inside `frontend/`):

```bash
npm run lint      # Run ESLint check
npm run build     # Build production bundle into frontend/dist
npm run preview   # Preview production bundle locally
```

---

### 5. Quick Full-Stack Startup Summary

1. **Terminal 1** (repository root `AlejandriaUPC/`):
   ```bash
   mvn spring-boot:run
   ```
2. **Terminal 2** (`AlejandriaUPC/frontend/`):
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

---

## Troubleshooting Common Issues

* **`mvn` is not recognized as a command (Windows):** Install Apache Maven and add its `\bin` directory to the system `PATH`, or run the goals from IntelliJ IDEA's integrated **Maven** panel (`Lifecycle` / `Plugins -> spring-boot:run`).
* **Frontend still shows mock data while Spring Boot is running:** Check `frontend/.env.local` and verify `VITE_USE_MOCK=false` (if missing, it defaults to `true`), then restart `npm run dev`.
* **Oracle / `ORA` / `TNS_ADMIN` connection errors:** Confirm the Wallet is extracted to the exact directory set in `spring.datasource.url` (using `/` instead of `\` on Windows) and verify `spring.datasource.username` and `spring.datasource.password`.
* **HTTP `503 AI_NOT_CONFIGURED` in AI Study:** Set `ai.api.key` in `src/main/resources/application-local.properties` (or `AI_API_KEY` environment variable).
* **OTP verification emails do not arrive:**
  * With `app.mail.provider=console`, check the Spring Boot terminal logs for `[DEV-MAIL]`.
  * With `smtp` (Gmail), confirm `spring.mail.password` is a **16-character App Password** (not your regular Gmail password) and `app.mail.from` matches your Gmail address.
  * With `resend`, confirm `app.mail.resend-api-key` and that your sender/domain is verified in Resend.

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

* **Sergio Alejandro Guerrero Espitia** — Full-Stack Developer & System Integrator
  * Built the complete **React + Vite + Material UI** frontend (`frontend/`), service layer, Light/Dark theme, and mock-first workflow.
  * Implemented the **AI Study Engine** end-to-end (Google Gemini integration with multi-model fallback, Quizzes/Summaries/Guides/Slides generation, daily quota, **My Study** library, and mutual-friend sharing).
  * Developed full-stack backend & frontend modules for JWT authentication & 6-digit OTP email verification (`console`/`smtp`/`resend`), Study Repositories & Collaborators, Document CRUD/preview & topic normalization, Social network (follows/friends) & Notifications, Personal/Global/Advanced Statistics, Moderation & Admin User management, Oracle Cloud Database-First alignment, and integration tests.
* **José Daniel Pinzón Racero** — Technical Lead / Backend Developer
  * Defined the Spring Boot layered architecture, initial Maven/Oracle Cloud setup, `SecurityConfig` & `CorsConfig`, global exception handling (`GlobalExceptionHandler`, `ErrorResponse`), initial service/controller scaffolding, and architecture/class diagrams (`docs/`).
* **Pablo Andrés Amaya Pabón** — Backend Developer
  * Designed and implemented the core JPA domain entities (`academy`, `analytic`, `governance`, `identity`, `repos`), cross-cutting domain enums, base Spring Data JPA repositories, and initial asynchronous `AnalyticsService`.
