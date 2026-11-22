import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import {
  DEFAULT_DISCOUNTS,
  DEFAULT_HOSTING_PLANS,
  DEFAULT_SITE_SETTINGS,
} from '../lib/defaults';
import {
  seedDefaultCatalogIfAdmin,
  toDate,
  verifyUserIsAdmin,
} from '../lib/database';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  CustomerProfile,
  HostingPlan,
  HostingServiceRecord,
  InvoiceRecord,
  OrderRecord,
  PaymentRecord,
  SiteSettings,
  SubscriptionDiscount,
} from '../types/hostnova';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ConfirmDialogState {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => Promise<void> | void;
}

interface HostNovaContextValue {
  // Navigation
  pathname: string;
  navigate: (to: string) => void;

  // Auth
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;

  // Public Catalog
  plans: HostingPlan[];
  discounts: SubscriptionDiscount[];
  settings: SiteSettings;
  catalogLoaded: boolean;

  // Checkout selection state
  selectedPlanId: string;
  selectedDurationMonths: number;
  selectPlanForCheckout: (planId: string, durationMonths: number) => void;
  setSelectedPlanId: (planId: string) => void;
  setSelectedDurationMonths: (months: number) => void;

  // Customer own data
  myOrders: OrderRecord[];
  myInvoices: InvoiceRecord[];
  myHostingServices: HostingServiceRecord[];

  // Admin full data
  allOrders: OrderRecord[];
  allPayments: PaymentRecord[];
  allInvoices: InvoiceRecord[];
  allHostingServices: HostingServiceRecord[];
  allProfiles: CustomerProfile[];
  adminDataLoading: boolean;

  // UI Helpers
  toasts: ToastItem[];
  notify: (type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
  confirmDialog: ConfirmDialogState | null;
  requestConfirm: (config: ConfirmDialogState) => void;
  closeConfirm: () => void;
  legalModal: 'terms' | 'privacy' | null;
  openLegalModal: (type: 'terms' | 'privacy') => void;
  closeLegalModal: () => void;
}

const HostNovaContext = createContext<HostNovaContextValue | null>(null);

function normalizePathname(raw: string): string {
  const cleaned = raw.split('?')[0].split('#')[0] || '/';
  if (cleaned.length > 1 && cleaned.endsWith('/')) {
    return cleaned.slice(0, -1);
  }
  return cleaned;
}

export function HostNovaProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(() =>
    normalizePathname(window.location.pathname)
  );
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Public catalog state (defaults until Firestore responds)
  const [plans, setPlans] = useState<HostingPlan[]>(DEFAULT_HOSTING_PLANS);
  const [discounts, setDiscounts] = useState<SubscriptionDiscount[]>(DEFAULT_DISCOUNTS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [catalogLoaded, setCatalogLoaded] = useState<boolean>(false);

  // Checkout selections
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [selectedDurationMonths, setSelectedDurationMonths] = useState<number>(12);

  // Customer own records
  const [myOrders, setMyOrders] = useState<OrderRecord[]>([]);
  const [myInvoices, setMyInvoices] = useState<InvoiceRecord[]>([]);
  const [myHostingServices, setMyHostingServices] = useState<HostingServiceRecord[]>([]);

  // Admin full records
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceRecord[]>([]);
  const [allHostingServices, setAllHostingServices] = useState<HostingServiceRecord[]>([]);
  const [allProfiles, setAllProfiles] = useState<CustomerProfile[]>([]);
  const [adminDataLoading, setAdminDataLoading] = useState<boolean>(false);

  // Global notifications & modals
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const navigate = useCallback((to: string) => {
    const normalized = normalizePathname(to);
    if (normalized !== normalizePathname(window.location.pathname)) {
      window.history.pushState({}, '', normalized);
    }
    setPathname(normalized);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setPathname(normalizePathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const adminCheck = await verifyUserIsAdmin(
          nextUser.uid,
          nextUser.email,
          Boolean(nextUser.emailVerified)
        );
        setIsAdmin(adminCheck);
        if (adminCheck) {
          seedDefaultCatalogIfAdmin().catch((err) => {
            console.error('Catalog seed check failed:', err);
          });
        }
      } else {
        setIsAdmin(false);
        setMyOrders([]);
        setMyInvoices([]);
        setMyHostingServices([]);
        setAllOrders([]);
        setAllPayments([]);
        setAllInvoices([]);
        setAllHostingServices([]);
        setAllProfiles([]);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Public Firestore catalog listeners (Plans, Discounts, Site Settings)
  useEffect(() => {
    const unsubPlans = onSnapshot(
      collection(db, 'hosting_plans'),
      (snap) => {
        if (!snap.empty) {
          const loaded: HostingPlan[] = snap.docs
            .map((d) => {
              const raw = d.data();
              return {
                id: d.id,
                name: String(raw.name || 'Plan'),
                tagline: String(raw.tagline || ''),
                monthlyPrice: Number(raw.monthlyPrice || 15),
                storageGb: Number(raw.storageGb || 10),
                websiteLimit: Number(raw.websiteLimit || 1),
                features: Array.isArray(raw.features)
                  ? raw.features.map((f) =>
                      String(f)
                        .replace(/Free SSL\s*\(Demo\)/gi, 'Free SSL Certificate')
                        .replace(/\s*\(Demo\)/gi, '')
                        .trim()
                    )
                  : [],
                isPopular: Boolean(raw.isPopular),
                isActive: raw.isActive !== false,
                sortOrder: Number(raw.sortOrder ?? 10),
                createdAt: raw.createdAt ? toDate(raw.createdAt) : undefined,
                updatedAt: raw.updatedAt ? toDate(raw.updatedAt) : undefined,
              };
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setPlans(loaded);
        } else {
          setPlans(DEFAULT_HOSTING_PLANS);
        }
        setCatalogLoaded(true);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'hosting_plans');
        } catch {
          setCatalogLoaded(true);
        }
      }
    );

    const unsubDiscounts = onSnapshot(
      collection(db, 'subscription_discounts'),
      (snap) => {
        if (!snap.empty) {
          const loaded: SubscriptionDiscount[] = snap.docs
            .map((d) => {
              const raw = d.data();
              return {
                id: d.id,
                durationMonths: Number(raw.durationMonths || 1),
                label: String(raw.label || `${raw.durationMonths} Months`),
                discountPercentage: Number(raw.discountPercentage || 0),
                isActive: raw.isActive !== false,
                updatedAt: raw.updatedAt ? toDate(raw.updatedAt) : undefined,
              };
            })
            .sort((a, b) => a.durationMonths - b.durationMonths);
          setDiscounts(loaded);
        } else {
          setDiscounts(DEFAULT_DISCOUNTS);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'subscription_discounts');
        } catch {
          // Keep approved default discounts
        }
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'site_settings', 'main'),
      (snap) => {
        if (snap.exists()) {
          const raw = snap.data();
          const rawEmail = String(raw.companyEmail || DEFAULT_SITE_SETTINGS.companyEmail);
          const rawPhone = String(raw.companyPhone || DEFAULT_SITE_SETTINGS.companyPhone);
          const rawAddr = String(raw.companyAddress || DEFAULT_SITE_SETTINGS.companyAddress);
          setSettings({
            id: snap.id,
            companyName: String(raw.companyName || DEFAULT_SITE_SETTINGS.companyName),
            tagline: String(raw.tagline || DEFAULT_SITE_SETTINGS.tagline),
            companyEmail: rawEmail.replace(/\.demo$/i, '.com'),
            companyPhone: rawPhone.replace(/\s*\(demo\)/gi, '').trim(),
            companyAddress: rawAddr.replace(/\s*\(demo address\)/gi, '').trim(),
            logoUrl: String(raw.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl),
            currency: 'USD',
            updatedAt: raw.updatedAt ? toDate(raw.updatedAt) : undefined,
          });
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'site_settings/main');
        } catch {
          // Keep default settings
        }
      }
    );

    return () => {
      unsubPlans();
      unsubDiscounts();
      unsubSettings();
    };
  }, []);

  // Customer own data listeners (strictly scoped to user.uid)
  useEffect(() => {
    if (authLoading || !user) return;

    const qOrders = query(collection(db, 'orders'), where('customerId', '==', user.uid));
    const unsubOrders = onSnapshot(
      qOrders,
      (snap) => {
        const list = snap.docs
          .map((d) => mapOrderDoc(d.id, d.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setMyOrders(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        } catch {
          // Handled cleanly
        }
      }
    );

    const qInvoices = query(collection(db, 'invoices'), where('customerId', '==', user.uid));
    const unsubInvoices = onSnapshot(
      qInvoices,
      (snap) => {
        const list = snap.docs
          .map((d) => mapInvoiceDoc(d.id, d.data()))
          .sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime());
        setMyInvoices(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'invoices');
        } catch {
          // Handled cleanly
        }
      }
    );

    const qHosting = query(collection(db, 'hosting_services'), where('customerId', '==', user.uid));
    const unsubHosting = onSnapshot(
      qHosting,
      (snap) => {
        const list = snap.docs
          .map((d) => mapHostingDoc(d.id, d.data()))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setMyHostingServices(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'hosting_services');
        } catch {
          // Handled cleanly
        }
      }
    );

    return () => {
      unsubOrders();
      unsubInvoices();
      unsubHosting();
    };
  }, [authLoading, user]);

  // Admin real-time business data listeners
  useEffect(() => {
    if (authLoading || !user || !isAdmin) {
      setAdminDataLoading(false);
      return;
    }

    setAdminDataLoading(true);
    let completed = 0;
    const markReady = () => {
      completed += 1;
      if (completed >= 5) setAdminDataLoading(false);
    };

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        setAllOrders(
          snap.docs
            .map((d) => mapOrderDoc(d.id, d.data()))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        );
        markReady();
      },
      (error) => {
        markReady();
        try {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        } catch {
          // Logged
        }
      }
    );

    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snap) => {
        setAllPayments(
          snap.docs
            .map((d) => mapPaymentDoc(d.id, d.data()))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        );
        markReady();
      },
      (error) => {
        markReady();
        try {
          handleFirestoreError(error, OperationType.LIST, 'payments');
        } catch {
          // Logged
        }
      }
    );

    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snap) => {
        setAllInvoices(
          snap.docs
            .map((d) => mapInvoiceDoc(d.id, d.data()))
            .sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime())
        );
        markReady();
      },
      (error) => {
        markReady();
        try {
          handleFirestoreError(error, OperationType.LIST, 'invoices');
        } catch {
          // Logged
        }
      }
    );

    const unsubHosting = onSnapshot(
      collection(db, 'hosting_services'),
      (snap) => {
        setAllHostingServices(
          snap.docs
            .map((d) => mapHostingDoc(d.id, d.data()))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        );
        markReady();
      },
      (error) => {
        markReady();
        try {
          handleFirestoreError(error, OperationType.LIST, 'hosting_services');
        } catch {
          // Logged
        }
      }
    );

    const unsubProfiles = onSnapshot(
      collection(db, 'profiles'),
      (snap) => {
        setAllProfiles(
          snap.docs
            .map((d) => {
              const raw = d.data();
              return {
                id: d.id,
                fullName: String(raw.fullName || ''),
                email: String(raw.email || ''),
                role: (raw.role === 'admin' ? 'admin' : 'customer') as 'admin' | 'customer',
                createdAt: toDate(raw.createdAt),
                updatedAt: toDate(raw.updatedAt),
              };
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        );
        markReady();
      },
      (error) => {
        markReady();
        try {
          handleFirestoreError(error, OperationType.LIST, 'profiles');
        } catch {
          // Logged
        }
      }
    );

    return () => {
      unsubOrders();
      unsubPayments();
      unsubInvoices();
      unsubHosting();
      unsubProfiles();
    };
  }, [authLoading, user, isAdmin]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      notify('success', `Signed in as ${result.user.displayName || result.user.email}`);
      return result.user;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        notify('info', 'Sign-in window closed.');
      } else {
        notify('error', 'Unable to complete Google sign-in. Please try again.');
      }
      return null;
    }
  }, [notify]);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      notify('info', 'You have been signed out.');
    } catch {
      notify('error', 'Failed to sign out. Please try again.');
    }
  }, [notify]);

  const selectPlanForCheckout = useCallback(
    (planId: string, durationMonths: number) => {
      setSelectedPlanId(planId);
      setSelectedDurationMonths(durationMonths);
      navigate('/checkout');
    },
    [navigate]
  );

  const value = useMemo<HostNovaContextValue>(
    () => ({
      pathname,
      navigate,
      user,
      authLoading,
      isAdmin,
      signInWithGoogle,
      signOutUser,
      plans,
      discounts,
      settings,
      catalogLoaded,
      selectedPlanId,
      selectedDurationMonths,
      selectPlanForCheckout,
      setSelectedPlanId,
      setSelectedDurationMonths,
      myOrders,
      myInvoices,
      myHostingServices,
      allOrders,
      allPayments,
      allInvoices,
      allHostingServices,
      allProfiles,
      adminDataLoading,
      toasts,
      notify,
      dismissToast,
      confirmDialog,
      requestConfirm: setConfirmDialog,
      closeConfirm: () => setConfirmDialog(null),
      legalModal,
      openLegalModal: setLegalModal,
      closeLegalModal: () => setLegalModal(null),
    }),
    [
      pathname,
      navigate,
      user,
      authLoading,
      isAdmin,
      signInWithGoogle,
      signOutUser,
      plans,
      discounts,
      settings,
      catalogLoaded,
      selectedPlanId,
      selectedDurationMonths,
      selectPlanForCheckout,
      myOrders,
      myInvoices,
      myHostingServices,
      allOrders,
      allPayments,
      allInvoices,
      allHostingServices,
      allProfiles,
      adminDataLoading,
      toasts,
      notify,
      dismissToast,
      confirmDialog,
      legalModal,
    ]
  );

  return <HostNovaContext.Provider value={value}>{children}</HostNovaContext.Provider>;
}

export function useHostNova(): HostNovaContextValue {
  const ctx = useContext(HostNovaContext);
  if (!ctx) {
    throw new Error('useHostNova must be used within a HostNovaProvider');
  }
  return ctx;
}

// =========================================================================
// Document Mappers
// =========================================================================
function mapOrderDoc(id: string, raw: Record<string, unknown>): OrderRecord {
  return {
    id,
    orderNumber: String(raw.orderNumber || ''),
    customerId: String(raw.customerId || ''),
    customerName: String(raw.customerName || ''),
    customerEmail: String(raw.customerEmail || ''),
    planId: String(raw.planId || ''),
    planNameSnapshot: String(raw.planNameSnapshot || ''),
    baseMonthlyPriceSnapshot: Number(raw.baseMonthlyPriceSnapshot || 0),
    storageSnapshot: Number(raw.storageSnapshot || 0),
    websiteLimitSnapshot: Number(raw.websiteLimitSnapshot || 1),
    durationMonths: Number(raw.durationMonths || 1),
    discountPercentage: Number(raw.discountPercentage || 0),
    discountedMonthlyPrice: Number(raw.discountedMonthlyPrice || 0),
    originalTotal: Number(raw.originalTotal || 0),
    discountAmount: Number(raw.discountAmount || 0),
    finalTotal: Number(raw.finalTotal || 0),
    domain: String(raw.domain || ''),
    githubRepository: String(raw.githubRepository || ''),
    paymentMethod: String(raw.paymentMethod || '').replace(/\s*\(Demo\)/gi, '').trim(),
    paymentId: String(raw.paymentId || ''),
    transactionId: String(raw.transactionId || ''),
    invoiceId: String(raw.invoiceId || ''),
    invoiceNumber: String(raw.invoiceNumber || ''),
    hostingDocId: String(raw.hostingDocId || ''),
    hostingId: String(raw.hostingId || ''),
    orderStatus: (raw.orderStatus as OrderRecord['orderStatus']) || 'CONFIRMED',
    paymentStatus: (raw.paymentStatus as OrderRecord['paymentStatus']) || 'SUCCESS',
    hostingStatus: (raw.hostingStatus as OrderRecord['hostingStatus']) || 'ACTIVE',
    isSimulated: raw.isSimulated !== false,
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}

function mapPaymentDoc(id: string, raw: Record<string, unknown>): PaymentRecord {
  return {
    id,
    transactionId: String(raw.transactionId || ''),
    orderId: String(raw.orderId || ''),
    orderNumber: String(raw.orderNumber || ''),
    customerId: String(raw.customerId || ''),
    customerName: String(raw.customerName || ''),
    customerEmail: String(raw.customerEmail || ''),
    paymentMethod: String(raw.paymentMethod || '').replace(/\s*\(Demo\)/gi, '').trim(),
    amount: Number(raw.amount || 0),
    currency: 'USD',
    paymentStatus: (raw.paymentStatus as PaymentRecord['paymentStatus']) || 'SUCCESS',
    isSimulated: raw.isSimulated !== false,
    createdAt: toDate(raw.createdAt),
  };
}

function mapInvoiceDoc(id: string, raw: Record<string, unknown>): InvoiceRecord {
  return {
    id,
    invoiceNumber: String(raw.invoiceNumber || ''),
    orderId: String(raw.orderId || ''),
    orderNumber: String(raw.orderNumber || ''),
    customerId: String(raw.customerId || ''),
    customerName: String(raw.customerName || ''),
    customerEmail: String(raw.customerEmail || ''),
    domain: String(raw.domain || ''),
    planNameSnapshot: String(raw.planNameSnapshot || ''),
    storageSnapshot: Number(raw.storageSnapshot || 0),
    websiteLimitSnapshot: Number(raw.websiteLimitSnapshot || 1),
    durationMonths: Number(raw.durationMonths || 1),
    baseMonthlyPriceSnapshot: Number(raw.baseMonthlyPriceSnapshot || 0),
    discountedMonthlyPrice: Number(raw.discountedMonthlyPrice || 0),
    originalTotal: Number(raw.originalTotal || 0),
    discountPercentage: Number(raw.discountPercentage || 0),
    discountAmount: Number(raw.discountAmount || 0),
    finalTotal: Number(raw.finalTotal || 0),
    paymentMethod: String(raw.paymentMethod || '').replace(/\s*\(Demo\)/gi, '').trim(),
    transactionId: String(raw.transactionId || ''),
    amount: Number(raw.amount || 0),
    currency: 'USD',
    paymentStatus:
      raw.paymentStatus === 'DEMO PAID'
        ? 'PAID'
        : ((raw.paymentStatus as InvoiceRecord['paymentStatus']) || 'PAID'),
    invoiceDate: toDate(raw.invoiceDate),
  };
}

function mapHostingDoc(id: string, raw: Record<string, unknown>): HostingServiceRecord {
  return {
    id,
    hostingId: String(raw.hostingId || ''),
    orderId: String(raw.orderId || ''),
    orderNumber: String(raw.orderNumber || ''),
    customerId: String(raw.customerId || ''),
    customerName: String(raw.customerName || ''),
    customerEmail: String(raw.customerEmail || ''),
    planId: String(raw.planId || ''),
    planName: String(raw.planName || ''),
    domain: String(raw.domain || ''),
    githubRepository: String(raw.githubRepository || ''),
    storageGb: Number(raw.storageGb || 10),
    websiteLimit: Number(raw.websiteLimit || 1),
    durationMonths: Number(raw.durationMonths || 1),
    startDate: String(raw.startDate || ''),
    renewalDate: String(raw.renewalDate || ''),
    status: (raw.status as HostingServiceRecord['status']) || 'ACTIVE',
    createdAt: toDate(raw.createdAt),
    updatedAt: toDate(raw.updatedAt),
  };
}
