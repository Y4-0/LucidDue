# LucidDue Development Rules & Architecture Guidelines

These rules are strictly enforced and MUST NOT be bypassed during development.

## 1. Stack & Technologies
- **UI:** Next.js (App Router)
- **Backend:** NestJS (API & Business Logic)
- **Database:** PostgreSQL (Persistent Data)
- **Caching/Jobs:** Redis (Future jobs/caching)
- **ORM:** Prisma
- **Authentication:** Better Auth (Server-managed sessions with secure cookies)

## 2. Security & Authentication (Critical)
- **Cookies over LocalStorage:** Never store authentication tokens, JWTs, refresh tokens, or session IDs in localStorage or sessionStorage.
- **Session Policies:** Use HTTPS and cookies with `Secure`, `HttpOnly`, and an appropriate `SameSite` policy.
- **Features Required:** Email/password, Google login, Email verification, Password reset, Logout, Session expiration/invalidation, and Rate limiting.
- **Rate Limiting:** Better Auth provides built-in rate limiting; configure stricter limits for sensitive authentication endpoints.
- **Passkeys:** Can be added later as a passwordless, phishing-resistant login option.

## 3. Server-Side Authorization (Critical)
- **Backend is the Boundary:** Never trust the frontend to enforce permissions.
- **Verification Flow:** Every protected request MUST verify:
  1. Authenticated user
  2. Organization membership
  3. Resource belongs to that organization
  4. User has permission to perform operation
- **Data Model:** Every business record MUST contain an `organizationId`.
- **Default Deny:** Never accept an arbitrary `organizationId` from the frontend and trust it. Use server-side authorization and default-deny access rules to prevent IDOR/resource-access vulnerabilities.

## 4. Data Protection
- Collect only the necessary information for the product.
- Never log passwords, authentication tokens, or sensitive credentials.
- Keep secrets in environment variables.
- Validate and sanitize all incoming API data.
- Return generic errors to users; do NOT expose stack traces or database internals.
- Use HTTPS in production.
- Keep database access private and restricted.
- Treat invoice/customer information as sensitive business data.

## 5. Development Discipline
- **One feature at a time:** Do not build the entire application at once.
- Each feature must include: Database changes, Backend/API implementation, Authorization checks, Frontend UI, Validation, Tests, and Error/loading/empty states.
- Do not implement future features unless explicitly requested.
- Do not add unnecessary dependencies or rewrite unrelated code.
- **Mandatory Checks:** After every feature, run: `typecheck`, `lint`, `tests`, and `build`. The app must remain deployable.

## 6. Product Principle
- The application should always follow: **Minimum data entry -> Useful information -> Clear next action.**
- The user should never feel that they are maintaining another accounting system.
- The product's job is simply: **Track → Understand → Remind → Follow Up → Record**
