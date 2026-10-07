# Development Log - LucidDue

**Oct 4-5, 2026: Initial Setup & Authentication**
- Initialized the monorepo architecture using Turborepo.
- Configured the backend with NestJS and the frontend with Next.js (App Router).
- Set up the PostgreSQL database connection using Prisma ORM.
- Integrated Better Auth for user authentication, handling sessions, login, and registration flows.
- Created a concurrent development script at the root to boot both the API and Web applications simultaneously.

**Oct 6-7, 2026: UI Foundation & Dashboard Design**
- Redesigned the main Dashboard adopting a "Warm Minimalist" aesthetic (using specific brand colors like Warm Pearl and Deep Forest).
- Built a library of reusable custom UI components in `apps/web/src/components/ui/core.tsx`. This includes the Modal, Drawer, FormFields, Select, Date/Currency inputs, and Toast notifications.
- Structured the dashboard layout to display summary metric cards (Total Outstanding, Due This Week, Overdue Invoices, Active Clients) correctly formatted for Indian Rupees (INR).

**Oct 7, 2026: Data Persistence & API Integration**
- Updated the Prisma schema to include relational `Client` and `Invoice` models tied directly to the authenticated `User`.
- Built backend API endpoints in NestJS to handle data creation and automatically calculate dashboard metrics based on due dates and amounts.
- Wired the frontend dashboard to fetch live data from the backend on load, ensuring it securely passes session credentials.
- Implemented the "+ Add Client" modal and "+ New Invoice" drawer to push data to the database and instantly refresh the dashboard UI.
- Fixed UI layer stacking issues to ensure modals correctly appear over side drawers.
