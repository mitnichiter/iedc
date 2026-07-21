# PROJECT_ANALYSIS.md

## Project Overview

**IEDC Website** is the official digital platform for the Innovation and Entrepreneurship Development Club (IEDC) at Carmel Polytechnic College, Alappuzha. 

It serves two primary purposes:
1.  **Public Showcase**: A modern, responsive landing page to display upcoming events, team members, and the club's mission to prospective students and the public.
2.  **Internal Management**: A dashboard for managing club members, member approvals, and event coordination.

## Tech Stack

### Frontend
-   **Framework**: Next.js 15 (App Router)
-   **Language**: JavaScript / React 19
-   **Styling**: Tailwind CSS 4 with `shadcn/ui` component library.
-   **Theme**: Custom "Ember & Steel" theme (Orange/Red/Dark), supporting Light/Dark modes via `next-themes`.
-   **Icons**: `lucide-react`

### Backend
-   **Platform**: Next.js API Routes (`app/api/...`)
-   **Database**: Firebase Firestore
-   **Authentication**: Firebase Authentication (Email/Password)
-   **Access Control**: Custom Role-Based Access Control (RBAC) using Firebase Custom Claims (`admin` role).

### Deployment
-   **Hosting**: Firebase Hosting

## Folder Structure

```
d:\iedc-website
├── app/                        # Next.js App Router root
│   ├── api/                    # Backend API Routes (replaced Cloud Functions)
│   │   ├── admin/              # Admin-only endpoints (members, events)
│   │   ├── auth/               # Auth handling endpoints
│   │   └── events/             # Public event data endpoints
│   ├── admin/                  # Admin Dashboard UI (Protected)
│   ├── dashboard/              # Member Dashboard UI (Protected)
│   ├── events/                 # Public Events Detail pages
│   ├── register/               # Auth pages (Login, Register)
│   ├── layout.js               # Root layout (Fonts, AuthProvider)
│   └── page.js                 # Public Landing Page
├── components/                 # React Components
│   ├── auth/                   # Auth wrappers (AdminRoute, ProtectedRoute)
│   └── ui/                     # shadcn/ui reusable components
├── lib/                        # Utilities
│   ├── AuthContext.js          # Authentication State Management
│   ├── firebase.js             # Client-side Firebase Init
│   └── firebase-admin.js       # Admin-side Firebase Init (implied)
├── public/                     # Static Assets (Images, SVGs)
└── firebase.json               # Firebase Deployment Config
```

## Features Implemented

### Public Interface
-   **Sticky Header**: Navigation and Theme Toggler.
-   **Hero Section**: High-impact visual with "Neony Vibey" background.
-   **Events Showcase**:
    -   Auto-categorization of "Upcoming" (sorted ASC) and "Past" (sorted DESC) events.
    -   Event cards with banners, dates, and venues.
-   **Team Section**: Grid layout for core team members.
-   **About/Mission**: Informational sections.

### User/Member Features
-   **Registration**: Sign-up flow (likely triggering 'pending_approval' status).
-   **Login**: Secure authentication.
-   **Dashboard**: (Placeholder/Basic implementation).

### Admin Features
-   **Member Management**: 
    -   List all registered users.
    -   View details (`fullName`, `email`, `dept`, `status`).
    -   **Approve Members**: promote `pending_approval` -> `approved`.
    -   **Delete Members**: Remove users from system.

## Data Flow & Architecture

1.  **Frontend-Backend Communication**: 
    -   Public pages (e.g., Homepage) fetch data directly from Firestore using client-side SDK (`getDocs`) for speed and reactivity.
    -   Admin actions (Approve/Delete) use **API Routes** (`/api/admin/...`) to perform privileged operations securely.

2.  **Authentication Flow**:
    -   `AuthContext` listens to Firebase Auth changes.
    -   On login, it fetches `idTokenResult` to get `customClaims`.
    -   `role` ('admin') in claims dictates access to `/admin` routes via `AdminRoute` wrapper.

## Important Files Explained

-   **`app/page.js`**: Main entry point. Contains logic to fetch and segregate events (Past vs Upcoming) client-side.
-   **`lib/AuthContext.js`**: The heart of security. Manages global user state and syncs custom claims.
-   **`app/admin/members/page.js`**: Key admin interface. Implements a table view with actions to Approve or Delete users. Connects to `api/admin/members` endpoints.
-   **`app/api/events/public/route.js`**: Server-side route to fetch public event data, ensuring consistent timestamp formatting.

## Current Limitations / Issues

> [!WARNING]
> **Documentation Drift**: The project files (`WARP.md`, `PROJECT_STRUCTURE.md`) reference a `functions/` directory for Firebase Cloud Functions, but this directory **does not exist**. The logic appears to have been migrated to `app/api`, but the documentation was not updated to reflect this major architectural change.

-   **Optimization**: `app/page.js` fetches *all* events client-side. As the event history grows, this will become slow. Should implement pagination or server-side filtering.
-   **Validation**: Frontend form validation relies largely on HTML attributes or basic checks. `zod` is in dependencies but usage needs verification.

## Security Review

-   **RBAC**: Implemented correctly via Custom Claims + API middleware checks (inferred).
-   **Data Access**:
    -   Public events are readable by all.
    -   User data is protected; Client-side logic in `AdminRoute` prevents UI access, whilst API routes (should) verify headers.
-   **Environment**: Requires `NEXT_PUBLIC_FIREBASE_*` keys and likely `FIREBASE_ADMIN_*` keys for server-side API routes.

## Suggestions for Improvement

1.  **Update Documentation**: Delete references to `functions/` folder.
2.  **Server-Side Rendering (SSR)**: Move event fetching in `app/page.js` to a Server Component to improve SEO and initial load performance.
3.  **Pagination**: Implement pagination for "Past Events".
4.  **Profile Management**: Allow users to edit their own profile (Dept, Year) in `dashboard`.

## Future Feature Ideas
-   **QR Code Attendance**: Generate QR codes for events; Admin scans to mark attendance.
-   **Certificate Generation**: Auto-generate participation certs for attendees.
-   **Blog/News**: A dedicated section for club achievements and articles.
