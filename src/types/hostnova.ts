export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
export type InvoicePaymentStatus = 'PAID' | 'DEMO PAID' | 'PENDING' | 'FAILED';
export type HostingStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';

export type CardBrandOption =
  | 'Visa'
  | 'Mastercard'
  | 'American Express'
  | 'Discover'
  | 'Debit Card'
  | 'Credit Card';

export type PaymentCategory = 'CARD' | 'PAYPAL' | 'BANK_TRANSFER';

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface HostingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  storageGb: number;
  websiteLimit: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionDiscount {
  id: string;
  durationMonths: number;
  label: string;
  discountPercentage: number;
  isActive: boolean;
  updatedAt?: Date;
}

export interface PricingBreakdown {
  baseMonthlyPrice: number;
  durationMonths: number;
  discountPercentage: number;
  discountedMonthlyPrice: number;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planNameSnapshot: string;
  baseMonthlyPriceSnapshot: number;
  storageSnapshot: number;
  websiteLimitSnapshot: number;
  durationMonths: number;
  discountPercentage: number;
  discountedMonthlyPrice: number;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  domain: string;
  githubRepository: string;
  paymentMethod: string;
  paymentId: string;
  transactionId: string;
  invoiceId: string;
  invoiceNumber: string;
  hostingDocId: string;
  hostingId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  hostingStatus: HostingStatus;
  isSimulated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRecord {
  id: string;
  transactionId: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  amount: number;
  currency: 'USD';
  paymentStatus: PaymentStatus;
  isSimulated: boolean;
  createdAt: Date;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  domain: string;
  planNameSnapshot: string;
  storageSnapshot: number;
  websiteLimitSnapshot: number;
  durationMonths: number;
  baseMonthlyPriceSnapshot: number;
  discountedMonthlyPrice: number;
  originalTotal: number;
  discountPercentage: number;
  discountAmount: number;
  finalTotal: number;
  paymentMethod: string;
  transactionId: string;
  amount: number;
  currency: 'USD';
  paymentStatus: InvoicePaymentStatus;
  invoiceDate: Date;
}

export interface HostingServiceRecord {
  id: string;
  hostingId: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  domain: string;
  githubRepository: string;
  storageGb: number;
  websiteLimit: number;
  durationMonths: number;
  startDate: string;
  renewalDate: string;
  status: HostingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSettings {
  id: string;
  companyName: string;
  tagline: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  logoUrl: string;
  currency: 'USD';
  updatedAt?: Date;
}

export type AdminSection =
  | 'dashboard'
  | 'orders'
  | 'hosting'
  | 'customers'
  | 'payments'
  | 'invoices'
  | 'plans'
  | 'settings';
