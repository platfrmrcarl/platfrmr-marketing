# Implementation Plan: Payments Integration

## Steps
1.  **Stripe Configuration**
    - [x] Set up environment variables for keys and price IDs.
    - [x] Initialize Stripe on the backend.
2.  **Checkout Flow**
    - [x] Create a `create-subscription` API endpoint.
    - [x] Design and implement the `/checkout` page with Stripe Elements.
3.  **Webhook Integration**
    - [x] Create a robust `/api/stripe/webhook` endpoint.
    - [x] Handle `invoice.payment_succeeded` to update Firestore.
4.  **Verification**
    - [x] Secure the webhook with signature verification.
