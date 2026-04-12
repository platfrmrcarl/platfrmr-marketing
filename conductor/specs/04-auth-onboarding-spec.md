# Spec: LinkedIn Auth & User Onboarding Flow

## 1. Metadata
- **Feature Name:** LinkedIn OAuth with Mandatory Onboarding
- **Status:** Specification
- **Target Routes:** `/api/auth/*`, `/onboarding`, `/dashboard`

## 2. Objective
Implement a secure authentication flow using LinkedIn OAuth 2.0 that forces new users to complete a profile setup at `/onboarding` before they can access the main application dashboard.

## 3. Data Schema (User Table)
The database schema must include the following fields to support this flow:

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID/String | Primary Key | Internal user identifier. |
| `linkedin_id` | String | Unique | The unique ID returned by LinkedIn. |
| `email` | String | Unique | User's LinkedIn email address. |
| `target_topics` | String | NULL | Comma-separated strings provided by user. |
| `target_niche` | String | NULL | Comma-separated strings provided by user. |
| `onboarding_complete` | Boolean | `false` | Status flag for the redirect logic. |

## 4. Logical Flow & Routing

### A. Authentication & Logic Gate
1. User authenticates via LinkedIn OAuth.
2. System checks the `onboarding_complete` boolean for that user record.
3. **Decision Point:**
   - If `onboarding_complete === true`: Redirect to `/dashboard`.
   - If `onboarding_complete === false`: Redirect to `/onboarding`.

### B. Onboarding Page (`/onboarding`)
- **Access Control:** This route is protected. Redirect to `/login` if no session exists.
- **Form Fields:**
    - `target_topics`: Text input. Instruction: "Separate topics with commas."
    - `target_niche`: Text input. Instruction: "Separate niches with commas."
- **Submit Action:**
    1. Sanitize input (trim whitespace).
    2. Update user record in database with the strings.
    3. Flip `onboarding_complete` to `true`.
    4. Redirect to `/dashboard`.

### C. Middleware Enforcement
- Create or update middleware to prevent users with `onboarding_complete: false` from manually navigating to `/dashboard` or other internal routes. They must be bounced back to `/onboarding`.

## 5. Implementation Instructions for Gemini Conductor
> **System Instruction:** > Please read this specification and generate the following:
> 1. The **Auth.js (NextAuth) or Passport configuration** for LinkedIn OAuth.
> 2. The **Database Migration** or Schema definition (Prisma/Drizzle/SQL).
> 3. The **Onboarding Form Component** at `/onboarding` with validation.
> 4. The **Server Action or API Route** to handle the form submission and update the `onboarding_complete` flag.
> 5. The **Middleware logic** to enforce the onboarding redirect based on the user's status.