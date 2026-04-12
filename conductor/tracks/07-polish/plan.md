# Implementation Plan: Final Polish & Testing

## Steps
1.  **Bug Fixes**
    - [ ] Standardize `userId` usage to `session.token.sub`.
    - [ ] Add check for `integrations.linkedin.user_urn` before publishing.
2.  **UX Enhancements**
    - [ ] Add a "Run Agent Now" button on the Dashboard with loading feedback.
    - [ ] Improve error messages for failed LinkedIn posts.
3.  **Verification**
    - [ ] Manual E2E test: Login -> Onboarding -> Mock Checkout -> Mock Cron Run.
