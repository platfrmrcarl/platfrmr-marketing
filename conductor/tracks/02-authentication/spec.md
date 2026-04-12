# Specification: Authentication Flow

## Requirements
- Support Google Login for general authentication.
- Support LinkedIn Login to obtain `w_member_social` permissions.
- Persist LinkedIn access tokens to the user's document in Firestore.
- Secure API routes using session checks.

## Tech Stack
- **NextAuth.js**: Framework for OAuth.
- **Firebase Auth/Firestore**: Token storage.
- **LinkedIn API**: `openid`, `profile`, `email`, `w_member_social` scopes.
