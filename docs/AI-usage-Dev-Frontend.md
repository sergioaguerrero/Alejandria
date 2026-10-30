# AI Usage Log

## Project: Alejandría — Study Repository & AI-Assisted Learning Platform

| Field | Information |
|---|---|
| **Full name** | [Sergio Alejandro Guerrero Espitia] |
| **Role in the project** | Frontend Developer |
| **Institutional email** | [sergioaguerrero@unicesar.edu.co] |
| **Identification document** | [1065600217] |
| **Academic program** | Systems Engineering (Ingeniería de Sistemas) |
| **Semester** | [4] |
| **Course / Project** | [PROGRAMACION DE COMPUTADORES III] |
| **Supervising professor** | [ALFREDO BAUTISTA] |
| **AI tools used** | 1. OpenCode (development agent) with DeepSeek V4.1 Flash Free (Initial Architecture & Sprints 1–3). 2. Google Antigravity (advanced agentic pair programmer) with Gemini 2.5 (Sprints 4–5, AI Study Engine, Full-Stack & Cloud Integration). |
| **Usage mode** | Conversational technical assistance: architectural design, component implementation, debugging, refactoring, and cloud database integration |
| **Main technologies** | React 18, Vite, Material UI (MUI v6), React Router v6, Axios, Recharts, Spring Boot 3.4 (Java 17), Oracle Cloud Autonomous Database (ATP), Oracle JDBC Wallet |

---

## 1. Purpose of this log

This log documents the use of artificial intelligence as a technical and pedagogical engineering tool during the development of the **Alejandría UPC** platform. Its purpose is to provide clear, organized, and verifiable evidence of:

- What technical challenges were delegated to or co-engineered with AI.
- Which architectural decisions were made, why they were chosen, and how trade-offs were evaluated.
- How AI code proposals were verified, tested, and refactored before merging.
- How the system evolved from a decoupled mock-first frontend into an end-to-end cloud-connected application (React + Spring Boot + Oracle Cloud Autonomous DB).

AI was not used to bypass learning or blindly inject code. It functioned as an active pair programmer to analyze complex errors, ensure strict adherence to software engineering patterns, design resilient data contracts, and troubleshoot deep cross-layer integration issues.

---

## 2. Methodology for working with AI

Work was organized across **user stories** and structured **sprints**, adhering to strict software engineering practices:

1. **Goal definition:** Each user story or bug was framed with clear functional requirements, constraints, and acceptance criteria.
2. **Prior code analysis:** The AI inspected existing domain models, DTOs, controllers, services, and UI components to preserve structural integrity, naming rules, and established patterns.
3. **Solution proposal:** The AI proposed architectural designs, atomic patches, or specialized components.
4. **Student review & validation:** The student examined proposed implementations, reviewed edge cases, and made final architectural decisions.
5. **Technical verification:** Execution of `eslint`, `npm run build`, backend compilation via Maven (`mvn compile`), and manual verification in the browser or via automated HTTP calls (`curl`).
6. **Atomic commits & stacked branching:** Every milestone was saved in an isolated git branch starting from the previous verified state, utilizing Conventional Commits in English.
7. **Documentation of technical trade-offs:** Design alternatives (e.g., in-memory mocks vs. live API proxying; BLOB database storage vs. object storage) were analyzed and documented.

### Project conventions maintained throughout development

- Code, comments, file names, API endpoints, and branches **in English**.
- User-visible text, labels, and error messages **in Spanish**.
- No unauthorized abbreviations in code (e.g., `repository`, never `repo`).
- One clear feature or fix per atomic commit (`feat(...)`, `fix(...)`, `refactor(...)`).
- The `main` branch remained stable and protected; feature development was conducted on dedicated stacked branches.
- Every asynchronous listing view adhered to the **three-state pattern**: loading (*Skeleton*), empty (*EmptyState*), and error (*Alert*).
- Destructive operations required confirmation through a modal `ConfirmDialog`.
- Notification feedback was delivered via non-blocking `Snackbar` components.

---

## 3. Timeline of work with AI

### 3.1. Phase 1: Architectural Foundation & Mock-First Strategy (OpenCode)

**Context.** The project required a clean, scalable frontend architecture before implementing individual views. The AI assisted in defining a domain-driven folder structure, client-side routing, and an agnostic service layer.

**Key achievements:**

- Implementation of the **Service Layer Pattern** (`src/services/`) with a dynamic toggle (`VITE_USE_MOCK`). Views never interact directly with Axios or raw mock data.
- Built-in in-memory reactive `store` simulating backend CRUD mutations, relationships, and referential integrity during offline mode.
- Global Axios instance with interceptors for JWT Bearer token injection and centralized error transformation into `ApiError`.
- Route guards using `ProtectedRoute` for private user views and role-based access control (Admin vs. Student).

---

### 3.2. Phase 2: Core Views, Content Management & Navigation (OpenCode)

**Stories worked on:** Authentication, Registration, Home/Catalog exploration, Repository detail, Document upload, Document detail, and Error boundaries.

**Key achievements:**

- Cascading filters by academic semester and subject.
- Repository detail organized hierarchically into academic terms (**Corte 1, Corte 2, Corte 3**).
- Document viewer with metadata inspection, download triggers, and like counters.
- Prevention of React state update memory leaks using cleanup cancellation flags in `useEffect`.

---

### 3.3. Phase 3: Social Interactions, Reporting & Administration (OpenCode)

**Stories worked on:** Shared `ReportDialog`, user profile management, public profiles, statistics dashboard, and search.

**Key achievements:**

- Polymorphic `ReportDialog` capable of reporting repositories, documents, or user profiles with duplicate detection (HTTP 409 simulation).
- User profile management with immutable institutional email and immediate context synchronization.
- Personal and global statistics visualization using **Recharts** (bar charts and trend lines).
- Cascading author updates in mock storage to prevent orphaned documents when a username changes.

---

### 3.4. Phase 4: AI Study Engine, Personalization & UI Polish (Antigravity)

**Stories worked on:** `feat/FE-20-ai-study`, `feat/FE-21-ai-quiz`, `feat/FE-22-ai-my-study`, `feat/FE-28-theme-mode`, `feat/FE-29-follow-repository-ai`, `fix/FE-20-ai-study-autocomplete`, `feat/FE-31-polish-qa`, and `feat/FE-04-registration-split-names`.

**Representative conversation:**

> **Student:** In the AI study generator, the subject dropdown allows students to pick subjects they are not studying. I want to limit AI generation strictly to repositories they have created or followed.
>
> **Assistant:** We can refactor `AiStudyPage.jsx` and `studyService.js` to replace the raw subject catalog query with `getRepositories({ followedOnly: true })` and `getMyRepositories()`. We will combine them, deduplicate by repository ID, and adapt the Autocomplete to bind directly to followed repositories.
>
> **Student:** The registration form also needs to collect first name, second name, first surname, and second surname as separate fields according to UPC academic standards.
>
> **Assistant:** We will update `RegisterPage.jsx` with four dedicated `TextField` inputs, validate that required fields (`firstName`, `firstLastname`) are present while optional fields (`secondName`, `secondLastname`) remain nullable, and update `authService.js` and `users.js` to compute the full display name seamlessly.

**Key achievements:**

- **AI Quiz Engine (Finite State Machine):** Implemented an interactive quiz simulator with time tracking, question navigation, real-time score calculation, and post-exam feedback.
- **AI Daily Quota Controller:** Added a visual quota meter preventing API exhaustion and teaching responsible AI usage.
- **Contextual AI Study Scoping:** Restricted study questionnaire generation exclusively to repositories created or followed by the user.
- **Theme Persistence Engine:** Built a dark/light mode toggle with MUI's `ThemeProvider` and `localStorage` persistence (`feat/FE-28-theme-mode`).
- **Academic Name Normalization:** Refactored user registration to separate names into four distinct fields to match UPC registrar standards.
- **Rebranding:** Standardized all UI brand text and headers to "Alejandría".

---

### 3.5. Phase 5: Backend Bootstrapping & Oracle Cloud Integration (Antigravity)

**Stories worked on:** `fix/BE-bootstrap-and-oracle-connection`, `feat/auth-integration`, `feat/catalog-and-subjects`, `feat/resource-upload-and-search`, and `feat/study-repositories`.

**Representative conversation:**

> **Student:** We have an Oracle Cloud Autonomous Database wallet zip and a Spring Boot backend, but the connection is failing with SSL/keystore errors, and the app crashes on entity mappings.
>
> **Assistant:** Autonomous DB requires Oracle SSO wallets. We need to unpack `Wallet_AlejandriaBD2026.zip`, configure `ojdbc11-production` with Oracle PKI dependencies in `pom.xml`, specify `TNS_ADMIN` in the JDBC thin URL, and rename the reserved SQL table name `User` to `APP_USER` in JPA.
>
> **Student:** Now that the database connects, how do we connect the frontend registration and login to the real database?
>
> **Assistant:** We configure Spring Security 6 with `BCryptPasswordEncoder`, set up CORS pattern matching for `http://localhost:*`, expose `/api/auth/register` and `/api/auth/login`, and map the frontend payload into a secure `UserDto` and session token.

**Key achievements:**

- **Oracle Cloud Autonomous Database Connection:** Integrated Oracle ATP using JDBC thin client with `TNS_ADMIN` pointing to the decrypted cloud wallet. Fixed `ORA-00903` reserved word collision by mapping `User` entity to `APP_USER`.
- **Real Authentication & Password Hashing:** Implemented `BCryptPasswordEncoder` in `SecurityConfig.java` and built `AuthController` with `/api/auth/register` and `/api/auth/login`, supporting both username and email logins.
- **Academic Catalog Seeder:** Created `DataInitializer.java` to automatically seed the University Faculty, Systems Engineering Program, Semesters 1 through 9, and all **62 official UPC curriculum subjects** directly into Oracle Cloud.
- **Cloud BLOB Storage for PDFs:** Implemented `ResourceController` and `ResourceService` allowing physical PDF uploads directly into Oracle Cloud BLOB fields, supporting searches by title/description and streaming downloads with `Content-Disposition`.
- **Study Repositories CRUD:** Created `StudyRepository` entity, JPA repository, service, and controller (`/api/repositories`), supporting likes, follows, and document categorization by academic term (**Corte 1, 2, 3**).

---

## 4. Specific technical contributions from AI

### 4.1. Architecture and Cross-Layer Integration

| Challenge | Proposed Solution | Result |
|---|---|---|
| Decouple frontend during backend development | Service Layer with `VITE_USE_MOCK` boolean flag | Frontend views required zero code changes when switching between mock and real API |
| Oracle Cloud Autonomous DB TLS handshake failure | Added `ojdbc11-production` (23.5.0) and configured `TNS_ADMIN` in connection string | Successful encrypted SSL/TLS connection to Oracle Cloud |
| SQL keyword collision on `User` entity | Renamed table to `@Table(name = "APP_USER")` | Clean Hibernate DDL table generation in Oracle Cloud |
| Missing UPC academic subjects in clean database | Implemented automated `DataInitializer` seeder | 62 official curriculum subjects instantly available via `/api/subjects` |
| Document categorizing by academic term in UI | Extended `Resource` entity with `term`, `topic`, and `StudyRepository` mapping | Uploaded documents properly populate Corte 1, 2, and 3 tabs |
| Vite dev server CORS blocking | Added reverse proxy in `vite.config.js` and allowed origin patterns in Spring Security | Zero CORS or cross-origin credential issues |

### 4.2. Debugging & Problem Solving

AI helped diagnose and fix complex technical issues:

- **Fast Refresh breakage:** Fixed circular exports by separating `AuthContext` creation from the `AuthProvider` component.
- **Race conditions on route change:** Injected `active` boolean flags inside asynchronous `useEffect` hooks to prevent updating unmounted components.
- **Global exception swallow in Spring Boot:** Diagnosed 500 error responses returned by `GlobalExceptionHandler` by adding explicit stack trace logging and aligning HTTP status codes.
- **Missing document rendering:** Identified that `RepositoryDetailPage.jsx` strictly required an integer `term` property (1, 2, or 3) and a nested `file` metadata object in `ResourceDto`, which were missing in the backend's initial entity mapping.

---

## 5. Work Traceability & Branch History

| Sprint / Phase | Story / Feature | Git Branch | Verification Method |
|---|---|---|---|
| Phase 1 | Project Base & Axios Setup | `feat/FE-01-project-base` | Build & dependency audit |
| Phase 1 | Agnostic Mock Service Layer | `feat/FE-02-mock-services` | Unit contract tests & mock latency simulation |
| Phase 1 | Layout, Routes & Navigation Guard | `feat/FE-03-layout-routes` | Browser session persistence & redirect testing |
| Phase 2 | Authentication & Login | `feat/FE-05-login` | Form validation & credentials verification |
| Phase 2 | Subjects of Interest | `feat/FE-06-my-subjects` | Multi-select state & semester grouping |
| Phase 2 | Home & Study Repositories Catalog | `feat/FE-10-home` | Filter queries & responsive grid rendering |
| Phase 2 | Repository Form & Management | `feat/FE-11-repository-form` | Form submission & validation error states |
| Phase 2 | Repository Detail & Term Tabs | `feat/FE-12-repository-detail` | Tab switching (Corte 1, 2, 3) & document listing |
| Phase 2 | Document Upload & BLOB validation | `feat/FE-15-upload-document` | Progress bar calculation & MIME verification |
| Phase 2 | Document Detail & Likes | `feat/FE-16-document-detail` | Download triggers & like toggle mutations |
| Phase 3 | User Profile & Security Settings | `feat/FE-07-profile` | Password change & session sync |
| Phase 3 | Search & Dynamic Filters | `feat/FE-17-search` | Live search input & debounced filtering |
| Phase 3 | Abuse Reporting Modal | `feat/FE-23-report-dialog` | Polymorphic targets & HTTP 409 conflict test |
| Phase 3 | Personal Statistics Dashboard | `feat/FE-25-my-statistics` | Recharts responsive container rendering |
| Phase 4 | Dark/Light Theme Switching | `feat/FE-28-theme-mode` | Theme token switching & local storage persistence |
| Phase 4 | AI Study Generator & Quota Guard | `feat/FE-20-ai-study` | Autocomplete binding & daily limit enforcement |
| Phase 4 | AI Quiz Simulator & Scoring | `feat/FE-21-ai-quiz` | Timer countdown & score calculation engine |
| Phase 4 | AI Questionnaires Saved Archive | `feat/FE-22-ai-my-study` | Card rendering & resume quiz flow |
| Phase 4 | Scoped AI to Followed Repositories | `feat/FE-29-follow-repository-ai` | Verified AI only triggers on followed subjects |
| Phase 4 | Four-Field Name Split for UPC | `feat/FE-04-registration-split-names` | Input binding & database persistence verification |
| Phase 5 | Oracle Cloud DB Bootstrap & Wallet | `fix/BE-bootstrap-and-oracle-connection` | Hibernate table creation in Oracle Cloud ATP |
| Phase 5 | Real Auth Integration & BCrypt | `feat/auth-integration` | End-to-end registration & login with real DB |
| Phase 5 | UPC Curriculum Pensum Seeder | `feat/catalog-and-subjects` | REST GET `/api/subjects` returning 62 subjects |
| Phase 5 | PDF Upload & Cloud BLOB Storage | `feat/resource-upload-and-search` | Multipart POST upload & byte download |
| Phase 5 | Study Repositories Cloud CRUD | `feat/study-repositories` | Real DB repository creation, likes, and documents |

---

## 6. What AI was used for and what it was not

### AI was used to:

- Formulate scalable frontend patterns (Service Layer, Envelope Normalization, Component-Driven Development).
- Troubleshoot complex low-level environment issues (Oracle Cloud JDBC Wallet SSL handshakes, CORS headers, Hibernate dialect mismatches).
- Refactor repetitive logic into clean, reusable custom hooks and modular components.
- Analyze compiler errors, ESLint violations, and Maven build failures.
- Formulate and verify resilient DTO contracts between React and Spring Boot.

### AI was not delegated:

- Defining the core academic purpose or scope of the platform.
- Deciding which architectural trade-offs to accept (e.g., opting for client-side normalization vs. server-side aggregation).
- Reviewing and approving code changes.
- Final testing, verification, and live demonstration execution in the browser.
- Authoring this log as an uncurated transcript: every entry reflects real, verified development milestones.

---

## 7. Lessons learned

1. **Clear requirements yield superior AI output:** Specifying exact data structures, component constraints, and UX requirements prevented generic or incomplete proposals.
2. **Layered architectures enable fear-free evolution:** Establishing a clean Service Layer early allowed the application to transition smoothly from in-memory mocks to live Oracle Cloud endpoints with zero UI rewrites.
3. **AI is an amplifier for software engineering rigor:** Using AI to inspect network logs, analyze stack traces, and review edge cases significantly reduced debugging time while reinforcing sound development practices.
4. **Verification is indispensable:** Code generated by any tool must be tested in real-world runtime environments to catch edge cases, layout shifts, or configuration mismatches.

---

**Date:** October 30, 2026
