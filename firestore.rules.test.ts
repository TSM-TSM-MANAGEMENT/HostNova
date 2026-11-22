/**
 * HostNova Firestore Security Rules Test Specification (Dirty Dozen Suite)
 * Verifies that all 12 adversarial payloads fail with PERMISSION_DENIED.
 */

export interface AdversarialTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actor: 'anonymous' | 'customerA' | 'unverifiedAdmin' | 'admin';
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
  enforcedBy: string;
}

export const DIRTY_DOZEN_TESTS: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Self-Admin Profile Escalation',
    collection: '/profiles/custA',
    operation: 'create',
    actor: 'customerA',
    payload: { id: 'custA', fullName: 'Attacker', email: 'a@test.com', role: 'admin' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "incoming().role == 'customer' on profile create",
  },
  {
    id: 2,
    name: 'Shadow Field Card Data Injection',
    collection: '/payments/pay_1',
    operation: 'create',
    actor: 'customerA',
    payload: { id: 'pay_1', cardNumber: '4242424242424242', cvv: '123' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidPayment() keys().hasOnly(...) rejects cardNumber/cvv',
  },
  {
    id: 3,
    name: 'Cross-Customer Order Read',
    collection: '/orders/ord_custB',
    operation: 'get',
    actor: 'customerA',
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'existing().customerId == request.auth.uid || isAdmin()',
  },
  {
    id: 4,
    name: 'Unscoped Order Collection Scrape',
    collection: '/orders',
    operation: 'list',
    actor: 'customerA',
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'allow list checks resource.data.customerId == request.auth.uid',
  },
  {
    id: 5,
    name: 'Orphaned Order Without Atomic Payment/Invoice/Hosting',
    collection: '/orders/ord_orphan',
    operation: 'create',
    actor: 'customerA',
    payload: { id: 'ord_orphan', customerId: 'custA' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'existsAfter() checks on payments, invoices, and hosting_services',
  },
  {
    id: 6,
    name: 'Customer Identity Spoofing on Order Create',
    collection: '/orders/ord_spoof',
    operation: 'create',
    actor: 'customerA',
    payload: { id: 'ord_spoof', customerId: 'custB' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().customerId == request.auth.uid',
  },
  {
    id: 7,
    name: 'Unverified Email Admin Spoofing',
    collection: '/hosting_plans/basic',
    operation: 'update',
    actor: 'unverifiedAdmin',
    payload: { monthlyPrice: 1 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isVerifiedUser() requires request.auth.token.email_verified == true',
  },
  {
    id: 8,
    name: 'Historical Price Snapshot Tampering',
    collection: '/orders/ord_1',
    operation: 'update',
    actor: 'admin',
    payload: { finalTotal: 0 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: "affectedKeys().hasOnly(['orderStatus', 'hostingStatus', 'updatedAt'])",
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    collection: '/orders/ord_time',
    operation: 'create',
    actor: 'customerA',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().createdAt == request.time',
  },
  {
    id: 10,
    name: 'Document ID Poisoning & Oversized Strings',
    collection: '/orders/' + 'x'.repeat(160),
    operation: 'create',
    actor: 'customerA',
    payload: { customerName: 'A'.repeat(500) },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidId(orderId) and customerName.size() <= 120',
  },
  {
    id: 11,
    name: 'Non-Admin Catalog Price Tampering',
    collection: '/hosting_plans/basic',
    operation: 'update',
    actor: 'customerA',
    payload: { monthlyPrice: 0.01 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isAdmin() required on hosting_plans writes',
  },
  {
    id: 12,
    name: 'Suspended Customer Self-Reactivation',
    collection: '/hosting_services/hs_1',
    operation: 'update',
    actor: 'customerA',
    payload: { status: 'ACTIVE' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'Only isAdmin() may update hosting_services status',
  },
];
