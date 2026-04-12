# Implementation Plan: Authentication Flow

## Steps
1.  **NextAuth Configuration**
    - [x] Create `[...nextauth]` route handler.
    - [x] Configure Google and LinkedIn providers.
2.  **Session & Token Management**
    - [x] Implement `jwt` callback to store access tokens.
    - [x] Implement `session` callback to expose tokens to the client and sync with Firestore.
3.  **Client-side Setup**
    - [x] Create `Providers` wrapper with `SessionProvider`.
    - [x] Wrap `layout.tsx` with `Providers`.
4.  **Security**
    - [x] Add `NEXTAUTH_SECRET` to environment variables.
