# HostNova Firestore Security Specification

## 1. Data Invariants
1. **No Public Admin Escalation**: A customer creating or updating `/profiles/{uid}` can never assign `role: "admin"` or write to `/admins/{uid}`.
2. **PII & Order Isolation**: Customers may only read (`get`/`list`) their own profile, orders, payments, invoices, and hosting services where `customerId == request.auth.uid`.
3. **Atomic Order Bundle**: Creating an order in `/orders/{orderId}` requires atomic co-creation (`existsAfter`) of its matching `/payments/{paymentId}`, `/invoices/{invoiceId}`, and `/hosting_services/{hostingDocId}` documents, plus an existing `hosting_plans/{planId}` record.
4. **Immutable Historical Snapshots**: Plan price, storage, website limit, and totals stored on `/orders` and `/invoices` are immutable after creation; editing a plan in `/hosting_plans` never mutates historical orders or invoices.
5. **Zero Sensitive Card Data**: `/payments` strictly enforces `hasOnly(...)` allowing only metadata (`paymentMethod`, `amount`, `currency`, `transactionId`, `paymentStatus`, `isSimulated`) — card numbers, CVV, and expiry dates are rejected at the rule layer as shadow fields.
6. **Admin-Only Lifecycle & Catalog Control**: Only verified admins may create/update/delete hosting plans, discounts, site settings, or change hosting/order statuses (`ACTIVE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`).
7. **Strict Timestamps & Size Bounds**: Every string field is size-bounded, every document ID is validated via `isValidId()`, and every `createdAt`/`updatedAt`/`invoiceDate` must equal `request.time`.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Self-Admin Profile Escalation**: Customer writes `/profiles/{uid}` with `{ role: "admin" }`.
2. **Ghost Field Card Storage**: Customer writes `/payments/{id}` containing `cardNumber: "4111..."` or `cvv: "123"`.
3. **Cross-Customer Order Read**: Customer A attempts `get` on Customer B's `/orders/{orderId}`.
4. **Unscoped List Scraping**: Customer A attempts unfiltered `list` on `/orders` without `where('customerId', '==', uid)`.
5. **Orphaned Order Without Payment/Invoice**: Customer creates `/orders/{id}` outside an atomic batch (missing `existsAfter` payment/invoice/hosting_service).
6. **Identity Spoofing on Checkout**: Customer A submits `/orders/{id}` with `customerId: "victim_uid"`.
7. **Unverified Email Bypass**: User with `email_verified: false` (even matching admin email) tries to write `/hosting_plans/basic`.
8. **Historical Price Tampering**: Customer or Admin attempts to update `finalTotal` or `baseMonthlyPriceSnapshot` on an existing `/orders/{id}`.
9. **Client Timestamp Forgery**: Customer creates `/orders/{id}` with backdated `createdAt` instead of `request.time`.
10. **ID Poisoning / Denial of Wallet**: Attacker creates `/orders/{150-char-junk-id}` or sends a 50KB `customerName`.
11. **Non-Admin Plan Manipulation**: Customer attempts to change `monthlyPrice` on `/hosting_plans/basic` to `0.01`.
12. **Customer Self-Reactivation**: Suspended customer attempts to update `/hosting_services/{id}` `status` from `SUSPENDED` back to `ACTIVE`.
