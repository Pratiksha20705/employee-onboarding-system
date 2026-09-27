# OnboardFlow — Employee Onboarding System

## 1. Overview
OnboardFlow manages the employee onboarding workflow end to end:

`Selected → Onboarding Started → Document Submission → Document Verification → Joining → Induction → Completed`

## 2. Business Problem
HR teams need one place to track a candidate from selection through their first day, with document verification and induction gating each subsequent step.

## 3. Features
- JWT-secured login (no fake auth)
- Candidate CRUD with search, status/department filters
- Candidate detail view with profile, progress bar and activity timeline
- Document upload, verification, rejection (with reason)
- Joining blocked until all 6 required documents are verified
- Induction activities; completing the last one auto-completes onboarding
- Dashboard and pipeline counts computed live from the database

## 4. Architecture
```
React + Vite  →  REST/JSON  →  Spring Boot  →  JPA/Hibernate  →  MySQL
```

## 5. Tech Stack
- Frontend: React, Vite, React Router, Axios, plain CSS
- Backend: Java 17, Spring Boot 3, Spring Security + JWT, Spring Data JPA, Bean Validation, Lombok, springdoc-openapi
- Database: MySQL 8

## 6. Project Structure
```
onboardflow/
├── frontend/   React app
├── backend/    Spring Boot app
├── database/   schema.sql, seed.sql
└── uploads/    uploaded document files (dev storage)
```

## 7. MySQL Setup
```sql
CREATE DATABASE onboardflow_db;
```
Optionally run `database/schema.sql` and `database/seed.sql` (the app also auto-creates the schema via `ddl-auto=update` and seeds the admin user on first boot).

## 8. Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Runs on http://localhost:8080. Swagger UI: http://localhost:8080/swagger-ui.html

## 9. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

## 10. Environment Variables
Backend (`application.properties`, overridable via env vars — see `backend/.env.example`):
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGINS` — comma-separated list of origins allowed to call the API (defaults to the local Vite dev server)
- `APP_SEED_HR_EMAIL`, `APP_SEED_HR_PASSWORD` — credentials for the HR account seeded on first boot
- `APP_SEED_CANDIDATE_EMAIL`, `APP_SEED_CANDIDATE_PASSWORD` — credentials for the demo candidate account seeded on first boot

The defaults baked into `application.properties` are for local development only. Set real values via environment variables for any shared or deployed environment — never commit real secrets.

Frontend: copy `frontend/.env.example` to `.env` and set `VITE_API_BASE_URL`.

## 11. Demo Credentials
```
HR
Email: hr@onboardflow.com
Password: Hr@12345

Candidate
Email: candidate@onboardflow.com
Password: Candidate@12345
```
Change these passwords (or set `APP_SEED_HR_PASSWORD` / `APP_SEED_CANDIDATE_PASSWORD` before first boot) before using the app outside of local development.

## 12. API Documentation
Full interactive docs at `/swagger-ui.html` once the backend is running. Key endpoints:
```
POST   /api/auth/login
GET    /api/candidates
POST   /api/candidates
GET    /api/candidates/{id}
PUT    /api/candidates/{id}
DELETE /api/candidates/{id}
POST   /api/onboarding/{id}/start
GET    /api/candidates/{id}/documents
POST   /api/candidates/{id}/documents
PATCH  /api/documents/{id}/verify
PATCH  /api/documents/{id}/reject
POST   /api/candidates/{id}/joining/confirm
GET    /api/candidates/{id}/induction
PATCH  /api/induction/{id}/complete
GET    /api/dashboard/summary
GET    /api/dashboard/pipeline
```

## 13. Database Schema
See `database/schema.sql` — tables: `users`, `candidates`, `documents`, `induction_activities`, `activity_logs`, with foreign keys and indexes.

## 14. Business Rules
- New candidates start at status `SELECTED`, stage `SELECTED`.
- Onboarding can only be started once per candidate.
- Verifying a document moves the candidate into `DOCUMENT_VERIFICATION` stage.
- Joining is rejected (`409`) unless all 6 required documents (Aadhaar, PAN, Resume, Degree Certificate, Bank Details, Passport Photo) are `VERIFIED`.
- Confirming joining creates the 6 default induction activities and moves stage to `INDUCTION`.
- Completing the last induction activity automatically sets status/stage to `COMPLETED`.

## 15. Testing
```bash
cd backend && mvn clean test
cd frontend && npm run build
```

## 16. Future Improvements
- Role-based access (multiple HR roles)
- Real file storage (S3) instead of local disk
- Reports page with charts and CSV export
- Pagination on the candidates list
- Refresh tokens
- **Phase 2 (planned, not implemented):** AI-assisted features such as document-review assistance, an onboarding-progress summary, or a support chatbot for candidates/HR. These are intentionally out of scope for this version.

See `docs/ARCHITECTURE.md` for a closer look at how the pieces fit together.
