
# Alejandría - Academic Resource & Analytics Platform

## Overview
Alejandría is a robust, web-based academic resource-sharing and learning analytics platform. Designed for university environments, it allows students to upload, share, and study academic materials while providing administrators with anonymized demand metrics and platform governance tools. The system integrates Artificial Intelligence to dynamically generate study quizzes from document metadata.

## Core Features
* **User Authentication & Identity:** Secure registration and login system with BCrypt password encryption.
* **Resource Management:** Secure upload and download of academic documents (up to 25 MB limit), stored as BLOBs with strict MIME type validation (PDF).
* **Learning Analytics:** Asynchronous tracking of user interactions (views, downloads, searches) with SHA-256 anonymization to protect student privacy. Generates demand metrics and exportable CSV reports.
* **Platform Governance:** Moderation system allowing students to report resources and administrators to apply disciplinary actions (e.g., resource removal, user suspension).
* **AI Quiz Generation:** Integration with Google Gemini API (1.5 Flash) to automatically generate multiple-choice study quizzes based on the uploaded resources.

## Tech Stack
**Backend:**
* Java
* Spring Boot (Web, Data JPA, Security)
* Oracle Database 18c XE
* RESTful API Architecture

**Frontend (Separate Repository):**
* React
* Vite

**Integrations:**
* Google Gemini API (Generative AI)

## Architecture
The backend is built following **Clean Architecture** principles to ensure modularity, scalability, and separation of concerns.
* `com.backend.controller`: Presentation layer exposing REST endpoints (`@RestController`).
* `com.backend.service`: Business logic layer orchestrating rules, validations, and external API calls (`@Service`).
* `com.backend.repository`: Data access layer using Spring Data JPA interfaces.
* `com.backend.domain`: Core entities and JPA mappings (e.g., `User`, `Resource`, `Report`, `Interaction`).
* `com.backend.cross` / `config`: Global configurations (CORS, Security, Enums).

## Prerequisites
* Java 17 or higher
* Maven
* Oracle Database 18c XE installed and running locally
* A Google AI Studio API Key (for Gemini)

## Environment Setup
Before running the application, configure your `application.properties` file located in `src/main/resources/`. **Do not commit your actual credentials to version control.**

```properties
# Oracle DB Configuration
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:XE
spring.datasource.username=alejandria
spring.datasource.password=your_database_password
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver

# JPA / Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# AI Configuration (Gemini API)
ai.api.url=[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=)
ai.api.key=your_gemini_api_key_here

# Analytics Security
analytics.salt=your_random_secret_salt_here
```
## API Endpoints Overview
Authentication: POST /api/auth/register | POST /api/auth/login

Resources: GET /api/resources | POST /api/resources/upload | GET /api/resources/{id}/download

Analytics: POST /api/analytics/interaction | GET /api/analytics/top-subjects | GET /api/analytics/export

Moderation: POST /api/moderation/report | POST /api/moderation/{reportId}/resolve

## AI Integration: GET /api/ai/quiz/{resourceId}

Team & Roles
José Daniel Pinzón Racero - Technical Lead / Backend Developer (Services, Architecture, AI Integration)

Pablo - Backend Developer (Controllers, Repositories, Exception Handling)

Sergio - Frontend Developer (React, Vite, UI/UX Integration)