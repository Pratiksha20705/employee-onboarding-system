# OnboardFlow — Employee Onboarding System (Frontend)

A frontend-only HR workflow management UI covering the full employee
onboarding journey: **Selected Candidate → Start Onboarding → Document
Submission → Document Verification → Joining → Induction → Onboarding
Completed.**

Built for a college placement / technical assessment. This is UI only —
no backend, no database, no real API calls. All data is static/mock data,
structured so it can be swapped for a Java Spring Boot + MySQL backend
later without rewriting the UI.

---

## 1. Installation & Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

Other scripts:

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

Login screen accepts any non-empty email/password (mock authentication —
see `src/context/AuthContext.jsx`).

---

## 2. Project Structure

```
onboardflow/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Route table
    ├── layouts/
    │   └── AppLayout.jsx       # Sidebar + Topbar + page outlet shell
    ├── components/             # Reusable, presentation-only UI pieces
    │   ├── Sidebar.jsx / Topbar.jsx
    │   ├── PageHeader.jsx / Breadcrumb.jsx
    │   ├── StatCard.jsx / StatusBadge.jsx / ProgressBar.jsx
    │   ├── Stepper.jsx / HorizontalStepper.jsx / Timeline.jsx / Pipeline.jsx
    │   ├── CandidateTable.jsx / DocumentTable.jsx / InductionTable.jsx
    │   ├── Modal.jsx / ConfirmDialog.jsx / ActionMenu.jsx
    │   ├── SearchBar.jsx / FilterDropdown.jsx
    │   ├── EmptyState.jsx / LoadingSpinner.jsx
    │   └── ProtectedRoute.jsx
    ├── pages/                  # One file per route
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Candidates.jsx / AddCandidate.jsx / CandidateDetails.jsx
    │   ├── Onboarding.jsx
    │   ├── Documents.jsx / Joining.jsx / Induction.jsx
    │   ├── Reports.jsx
    │   ├── Settings.jsx
    │   └── NotFound.jsx
    ├── context/                 # ToastContext, AuthContext (mock auth)
    ├── hooks/                   # useToast, useAuth
    ├── data/                    # Mock data (candidates, documents, joining, induction, activity, dashboard)
    ├── services/                 # Data-access layer — swap for real API calls later
    ├── utils/                    # dateUtils, constants
    └── styles/
        ├── tokens.css            # Design tokens (color, type, spacing, radius)
        └── global.css            # All component/page styles
```

---

## 3. Routes

| Path | Page |
|---|---|
| `/login` | Login |
| `/dashboard` | Dashboard |
| `/candidates` | Candidates list |
| `/candidates/new` | Add Candidate |
| `/candidates/:id` | Candidate Details |
| `/onboarding` | Onboarding overview |
| `/onboarding/:id/documents` | Documents (candidate-scoped) |
| `/onboarding/:id/joining` | Joining (candidate-scoped) |
| `/onboarding/:id/induction` | Induction (candidate-scoped) |
| `/documents`, `/joining`, `/induction` | Same pages, with an in-page candidate picker |
| `/reports` | Reports |
| `/settings` | Settings |

All authenticated routes are wrapped in `AppLayout` (sidebar + topbar) via
`ProtectedRoute`, which mock-gates access behind the Login page.

---

## 4. Implemented Pages

1. **Login** — split branding/workflow panel + sign-in form, mock auth.
2. **Dashboard** — 6 summary stat cards, onboarding pipeline visual, recent
   onboarding table, pending actions list.
3. **Candidates** — searchable/filterable/sortable table with status badges
   and a row action menu (View / Edit / Delete with confirm dialog).
4. **Add Candidate** — sectioned form (candidate info, job info, status)
   with client-side validation.
5. **Candidate Details** — profile header, vertical onboarding stepper,
   quick actions, activity timeline.
6. **Onboarding** — candidate picker, horizontal stepper across the 6
   stages, summary panel, remarks.
7. **Documents** — required-document table, verify/reject actions,
   rejection-reason alert, upload modal.
8. **Joining** — joining details form; **blocks confirmation with a warning
   alert until all documents are verified** (never just implies it's
   available).
9. **Induction** — activity table, mark-complete action, add-activity
   modal, "all activities completed" banner.
10. **Reports** — stat cards, monthly trend bar chart, department
    distribution donut chart (both hand-rolled SVG/CSS, no chart library),
    filters, export button (UI-only).
11. **Settings** — profile, notification preferences, application
    preferences.

Every page has loading states (`LoadingSpinner`), empty states
(`EmptyState`) where a list could be empty, and toast notifications
(`useToast`) for actions like save/delete/verify/reject/confirm.

---

## 5. Mock Data

Lives entirely under `src/data/`, separate from components and pages:

- `candidates.js` — 10 realistic candidates across Engineering, Analytics
  and HR, each with a `status` and `onboardingStage`.
- `documents.js` — per-candidate document records (Aadhaar, PAN, Resume,
  Degree Certificate, Bank Details, Passport Photo), including a rejected
  example with a reason.
- `joining.js` — per-candidate joining records.
- `induction.js` — per-candidate induction activities (HR Orientation,
  Company Introduction, IT Setup, Security Training, Team Introduction,
  Policy Training).
- `activity.js` — per-candidate activity timeline entries.
- `dashboard.js` — dashboard stats, pipeline stage counts, pending
  actions, monthly trend and department distribution for Reports.

---

## 6. Connecting to the Future Spring Boot Backend

All data access goes through `src/services/*Service.js` — pages never
import `src/data/*` directly for anything they'd eventually fetch from a
real API (only static option lists like `departments`/`positions` are
imported directly, since those would come from a lookup endpoint too).

Each service function currently does:

```js
// today
export async function fetchCandidates() {
  await delay();
  return candidates; // from src/data/candidates.js
}
```

To connect the real backend, only the **body** changes — signatures and
return shapes stay the same so no page needs to be touched:

```js
// after backend integration
import api from './api';
export async function fetchCandidates() {
  const res = await api.get('/api/candidates');
  return res.data;
}
```

`src/services/api.js` has a commented-out Axios instance ready to be
uncommented once `VITE_API_BASE_URL` points at the Spring Boot server:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});
```

Expected REST resources on the backend side (suggested, not required):

- `GET/POST /api/candidates`, `GET/PUT/DELETE /api/candidates/{id}`
- `GET /api/candidates/{id}/documents`, `PATCH /api/documents/{id}/verify`,
  `PATCH /api/documents/{id}/reject`, `POST /api/documents/upload`
- `GET/POST /api/candidates/{id}/joining`
- `GET/POST /api/candidates/{id}/induction`,
  `PATCH /api/induction/{id}/complete`
- `GET /api/dashboard/stats`, `GET /api/dashboard/pipeline`
- `GET /api/reports?...`

---

## 7. Design System

Defined once in `src/styles/tokens.css` and consumed everywhere via CSS
custom properties — no hardcoded colors in components:

- **Ink navy** (`--ink-900` etc.) for the sidebar/structural surfaces.
- **Muted brass** accent, used sparingly (brand mark, one donut-chart
  slice) rather than as a decorative wash.
- **Desaturated semantic colors** for status: success (green), warning
  (amber), danger (red), neutral (gray) — paired with badge dot markers
  so status is never color-only.
- Type scale, spacing scale, radius and border tokens shared across every
  component in `global.css`.

Responsive behavior: sidebar collapses to icons on desktop and becomes an
off-canvas drawer under 960px; tables scroll horizontally on small
screens; forms and the two-column layouts stack to a single column.
