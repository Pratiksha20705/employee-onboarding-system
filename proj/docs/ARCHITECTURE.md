# OnboardFlow — Architecture

This document describes the current (Phase 1) architecture. There is no AI/ML
component anywhere in this version — see the README's "Future Improvements"
section for what's planned, but not built, for a later phase.

## Request flow

```
 Browser (React SPA)
        │
        │  Axios (JSON over HTTPS/HTTP)
        ▼
 React Router routes ──► Pages ──► Services (services/*.js) ──► api.js (Axios instance)
        │
        │  Authorization: Bearer <JWT>
        ▼
 Spring Boot REST API  (/api/**)
        │
        ▼
 JwtAuthFilter  ──►  SecurityConfig (route-level access rules)
        │
        ▼
 Controllers (@RestController)
        │
        ▼
 Services (business rules, e.g. "joining blocked until docs verified")
        │
        ▼
 Repositories (Spring Data JPA)
        │
        ▼
 MySQL (candidates, documents, induction_activities, activity_logs, users)
```

## Frontend

- **Pages** (`src/pages`) own a route and page-level data fetching/state.
- **Components** (`src/components`) are presentational/reusable (tables,
  badges, modals, stat cards, etc.) and are shared across pages.
- **Services** (`src/services`) are the only place that call the backend;
  pages never call Axios directly. Each service wraps one backend resource
  (candidates, documents, joining, induction, dashboard, auth).
- **Context** (`src/context`) holds cross-cutting client state: the
  authenticated user/JWT (`AuthContext`) and toast notifications
  (`ToastContext`).
- **Styles**: a single design-token file (`styles/tokens.css`) defines the
  color, spacing, radius and typography scale; `global.css` builds on top of
  those tokens so every page shares one visual language rather than
  page-specific styling.

## Backend

Standard layered Spring Boot structure:

- **Controller** — HTTP boundary only: request/response mapping, validation
  triggers, delegating to a service. No business logic.
- **Service** — business rules and orchestration (e.g. a candidate can't be
  marked as "joined" until all required documents are `VERIFIED`; completing
  the last induction activity auto-completes onboarding).
- **Repository** — Spring Data JPA interfaces over the entities; no custom
  SQL beyond what derived/`@Query` methods need.
- **Entity** — JPA-mapped tables.
- **DTO** — request/response shapes, kept separate from entities so the API
  contract doesn't leak persistence details.
- **Security** — `JwtAuthFilter` validates the bearer token on every request
  and populates the security context; `SecurityConfig` declares which routes
  require authentication. `JwtUtil` issues/validates tokens.
- **Exception handling** — `GlobalExceptionHandler` converts known exceptions
  (`ResourceNotFoundException`, `BusinessRuleException`, validation errors,
  bad credentials) into a consistent `{ message, status }` JSON body. Any
  unexpected exception is logged server-side and returns a generic message —
  stack traces and internal details are never sent to the client.

## Data model (high level)

```
User (HR admin) ──authenticates via──> JWT

Candidate 1 ──* DocumentRecord
Candidate 1 ──* InductionActivity
Candidate 1 ──* ActivityLog
```

`Candidate.status` / `Candidate.stage` drive the pipeline shown on the
Dashboard and Onboarding pages:

```
SELECTED → DOCUMENT_SUBMISSION → DOCUMENT_VERIFICATION → JOINING → INDUCTION → COMPLETED
```

## Configuration

All environment-specific values (DB credentials, JWT secret, CORS origins,
seeded admin credentials) are read from environment variables with
local-development-only fallbacks defined in `application.properties`. See
`backend/.env.example` for the full list. Nothing environment-specific is
hardcoded in source.
