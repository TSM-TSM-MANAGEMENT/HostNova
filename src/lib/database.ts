import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  DEFAULT_DISCOUNTS,
  DEFAULT_HOSTING_PLANS,
  DEFAULT_SITE_SETTINGS,
} from './defaults';
import { db, handleFirestoreError, OperationType } from './firebase';
import { addMonthsIso, calculatePricing, generateIdentifiers } from './pricing';
import {
  HostingPlan,
  HostingServiceRecord,
  HostingStatus,
  InvoiceRecord,
  OrderRecord,
  OrderStatus,
  PaymentRecord,
  SiteSettings,
  SubscriptionDiscount,
} from '../types/hostnova';

export function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const parsed = new Date(val);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export async function verifyUserIsAdmin(uid: string, email: string | null, emailVerified: boolean): Promise<boolean> {
  if (!emailVerified) return false;
  if (email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export async function ensureCustomerProfile(uid: string, fullName: string, email: string): Promise<void> {
  const safeName = fullName.trim().slice(0, 120) || 'HostNova Customer';
  const safeEmail = email.trim().slice(0, 200);
  const profileRef = doc(db, 'profiles', uid);

  try {
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      await setDoc(profileRef, {
        id: uid,
        fullName: safeName,
        email: safeEmail,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(profileRef, {
        fullName: safeName,
        email: safeEmail,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `profiles/${uid}`);
  }
}

export async function seedDefaultCatalogIfAdmin(): Promise<void> {
  try {
    const plansSnap = await getDocs(collection(db, 'hosting_plans'));
    if (plansSnap.empty) {
      const batch = writeBatch(db);
      for (const plan of DEFAULT_HOSTING_PLANS) {
        batch.set(doc(db, 'hosting_plans', plan.id), {
          id: plan.id,
          name: plan.name,
          tagline: plan.tagline,
          monthlyPrice: plan.monthlyPrice,
          storageGb: plan.storageGb,
          websiteLimit: plan.websiteLimit,
          features: plan.features,
          isPopular: plan.isPopular,
          isActive: plan.isActive,
          sortOrder: plan.sortOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } else {
      const migrateBatch = writeBatch(db);
      let hasChanges = false;
      for (const d of plansSnap.docs) {
        const raw = d.data();
        const feats = Array.isArray(raw.features) ? raw.features.map(String) : [];
        if (feats.some((f) => /demo/i.test(f))) {
          const cleaned = feats.map((f) => f.replace(/\s*\(demo\)/gi, ' Certificate').replace(/Certificate Certificate/gi, 'Certificate').trim());
          migrateBatch.update(doc(db, 'hosting_plans', d.id), {
            features: cleaned,
            updatedAt: serverTimestamp(),
          });
          hasChanges = true;
        }
      }
      if (hasChanges) {
        await migrateBatch.commit();
      }
    }

    const discountsSnap = await getDocs(collection(db, 'subscription_discounts'));
    if (discountsSnap.empty) {
      const batch = writeBatch(db);
      for (const discount of DEFAULT_DISCOUNTS) {
        batch.set(doc(db, 'subscription_discounts', discount.id), {
          id: discount.id,
          durationMonths: discount.durationMonths,
          label: discount.label,
          discountPercentage: discount.discountPercentage,
          isActive: discount.isActive,
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }

    const settingsSnap = await getDoc(doc(db, 'site_settings', 'main'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'site_settings', 'main'), {
        id: 'main',
        companyName: DEFAULT_SITE_SETTINGS.companyName,
        tagline: DEFAULT_SITE_SETTINGS.tagline,
        companyEmail: DEFAULT_SITE_SETTINGS.companyEmail,
        companyPhone: DEFAULT_SITE_SETTINGS.companyPhone,
        companyAddress: DEFAULT_SITE_SETTINGS.companyAddress,
        logoUrl: DEFAULT_SITE_SETTINGS.logoUrl,
        currency: 'USD',
        updatedAt: serverTimestamp(),
      });
    } else {
      const raw = settingsSnap.data();
      const email = String(raw.companyEmail || '');
      const phone = String(raw.companyPhone || '');
      const addr = String(raw.companyAddress || '');
      if (/demo/i.test(email) || /demo/i.test(phone) || /demo/i.test(addr)) {
        await updateDoc(doc(db, 'site_settings', 'main'), {
          companyEmail: email.replace(/\.demo$/i, '.com') || DEFAULT_SITE_SETTINGS.companyEmail,
          companyPhone: phone.replace(/\s*\(demo\)/gi, '').trim() || DEFAULT_SITE_SETTINGS.companyPhone,
          companyAddress: addr.replace(/\s*\(demo address\)/gi, '').trim() || DEFAULT_SITE_SETTINGS.companyAddress,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'catalog_seed');
  }
}

export interface SubmitOrderInput {
  customerId: string;
  customerName: string;
  customerEmail: string;
  plan: HostingPlan;
  discount: SubscriptionDiscount;
  domain: string;
  githubRepository: string;
  paymentMethodLabel: string;
}

export interface SubmitOrderResult {
  order: OrderRecord;
  payment: PaymentRecord;
  invoice: InvoiceRecord;
  hostingService: HostingServiceRecord;
}

/**
 * Atomic simulated order confirmation workflow.
 * IMPORTANT SECURITY GUARANTEE: Card numbers, CVV, and expiry dates are NEVER accepted here,
 * NEVER transmitted to Firestore, and NEVER logged.
 */
export async function submitDemoOrderAtomic(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  const safeName = input.customerName.trim().slice(0, 120);
  const safeEmail = input.customerEmail.trim().slice(0, 200);
  const safeDomain = input.domain.trim().slice(0, 253);
  const safeGithub = input.githubRepository.trim().slice(0, 300);
  const safePaymentMethod = input.paymentMethodLabel.trim().slice(0, 60);

  // Step 1: Ensure customer profile exists/updates cleanly
  await ensureCustomerProfile(input.customerId, safeName, safeEmail);

  // Step 2: Recompute exact authoritative totals using single pricing formula
  const pricing = calculatePricing(
    input.plan.monthlyPrice,
    input.discount.durationMonths,
    input.discount.discountPercentage
  );

  // Step 3: Generate unique IDs & subscription dates
  const ids = generateIdentifiers();
  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const renewalDate = addMonthsIso(now, pricing.durationMonths);

  // Step 4: Atomic writeBatch creating Order + Payment + Invoice + HostingService simultaneously
  const batch = writeBatch(db);

  const orderRef = doc(db, 'orders', ids.orderDocId);
  const paymentRef = doc(db, 'payments', ids.paymentDocId);
  const invoiceRef = doc(db, 'invoices', ids.invoiceDocId);
  const hostingRef = doc(db, 'hosting_services', ids.hostingDocId);

  const orderPayload = {
    id: ids.orderDocId,
    orderNumber: ids.orderNumber,
    customerId: input.customerId,
    customerName: safeName,
    customerEmail: safeEmail,
    planId: input.plan.id,
    planNameSnapshot: input.plan.name.slice(0, 60),
    baseMonthlyPriceSnapshot: pricing.baseMonthlyPrice,
    storageSnapshot: input.plan.storageGb,
    websiteLimitSnapshot: input.plan.websiteLimit,
    durationMonths: pricing.durationMonths,
    discountPercentage: pricing.discountPercentage,
    discountedMonthlyPrice: pricing.discountedMonthlyPrice,
    originalTotal: pricing.originalTotal,
    discountAmount: pricing.discountAmount,
    finalTotal: pricing.finalTotal,
    domain: safeDomain,
    githubRepository: safeGithub,
    paymentMethod: safePaymentMethod,
    paymentId: ids.paymentDocId,
    transactionId: ids.transactionId,
    invoiceId: ids.invoiceDocId,
    invoiceNumber: ids.invoiceNumber,
    hostingDocId: ids.hostingDocId,
    hostingId: ids.hostingId,
    orderStatus: 'CONFIRMED' as OrderStatus,
    paymentStatus: 'SUCCESS' as const,
    hostingStatus: 'ACTIVE' as HostingStatus,
    isSimulated: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const paymentPayload = {
    id: ids.paymentDocId,
    transactionId: ids.transactionId,
    orderId: ids.orderDocId,
    orderNumber: ids.orderNumber,
    customerId: input.customerId,
    customerName: safeName,
    customerEmail: safeEmail,
    paymentMethod: safePaymentMethod,
    amount: pricing.finalTotal,
    currency: 'USD' as const,
    paymentStatus: 'SUCCESS' as const,
    isSimulated: true,
    createdAt: serverTimestamp(),
  };

  const invoicePayload = {
    id: ids.invoiceDocId,
    invoiceNumber: ids.invoiceNumber,
    orderId: ids.orderDocId,
    orderNumber: ids.orderNumber,
    customerId: input.customerId,
    customerName: safeName,
    customerEmail: safeEmail,
    domain: safeDomain,
    planNameSnapshot: input.plan.name.slice(0, 60),
    storageSnapshot: input.plan.storageGb,
    websiteLimitSnapshot: input.plan.websiteLimit,
    durationMonths: pricing.durationMonths,
    baseMonthlyPriceSnapshot: pricing.baseMonthlyPrice,
    discountedMonthlyPrice: pricing.discountedMonthlyPrice,
    originalTotal: pricing.originalTotal,
    discountPercentage: pricing.discountPercentage,
    discountAmount: pricing.discountAmount,
    finalTotal: pricing.finalTotal,
    paymentMethod: safePaymentMethod,
    transactionId: ids.transactionId,
    amount: pricing.finalTotal,
    currency: 'USD' as const,
    paymentStatus: 'PAID' as const,
    invoiceDate: serverTimestamp(),
  };

  const hostingPayload = {
    id: ids.hostingDocId,
    hostingId: ids.hostingId,
    orderId: ids.orderDocId,
    orderNumber: ids.orderNumber,
    customerId: input.customerId,
    customerName: safeName,
    customerEmail: safeEmail,
    planId: input.plan.id,
    planName: input.plan.name.slice(0, 60),
    domain: safeDomain,
    githubRepository: safeGithub,
    storageGb: input.plan.storageGb,
    websiteLimit: input.plan.websiteLimit,
    durationMonths: pricing.durationMonths,
    startDate,
    renewalDate,
    status: 'ACTIVE' as HostingStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(orderRef, orderPayload);
  batch.set(paymentRef, paymentPayload);
  batch.set(invoiceRef, invoicePayload);
  batch.set(hostingRef, hostingPayload);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${ids.orderDocId}`);
  }

  return {
    order: { ...orderPayload, createdAt: now, updatedAt: now },
    payment: { ...paymentPayload, createdAt: now },
    invoice: { ...invoicePayload, invoiceDate: now },
    hostingService: { ...hostingPayload, createdAt: now, updatedAt: now },
  };
}

export async function updateHostingAndOrderStatus(
  hostingDocId: string,
  orderId: string,
  newHostingStatus: HostingStatus
): Promise<void> {
  const newOrderStatus: OrderStatus = newHostingStatus === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED';
  const batch = writeBatch(db);

  batch.update(doc(db, 'hosting_services', hostingDocId), {
    status: newHostingStatus,
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'orders', orderId), {
    hostingStatus: newHostingStatus,
    orderStatus: newOrderStatus,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `hosting_services/${hostingDocId}`);
  }
}

export async function saveHostingPlan(plan: Omit<HostingPlan, 'createdAt' | 'updatedAt'>, isNew: boolean): Promise<void> {
  const cleanId = plan.id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 64);

  const cleanFeatures = plan.features
    .map((f) => f.trim().slice(0, 120))
    .filter((f) => f.length > 0)
    .slice(0, 15);

  if (cleanFeatures.length === 0) {
    cleanFeatures.push(`${plan.storageGb} GB SSD Storage`);
  }

  const ref = doc(db, 'hosting_plans', cleanId);

  try {
    if (isNew) {
      await setDoc(ref, {
        id: cleanId,
        name: plan.name.trim().slice(0, 60),
        tagline: plan.tagline.trim().slice(0, 160) || 'Managed SSD hosting plan.',
        monthlyPrice: Number(plan.monthlyPrice),
        storageGb: Math.max(1, Math.round(Number(plan.storageGb))),
        websiteLimit: Math.max(1, Math.round(Number(plan.websiteLimit))),
        features: cleanFeatures,
        isPopular: Boolean(plan.isPopular),
        isActive: Boolean(plan.isActive),
        sortOrder: Number(plan.sortOrder) || 10,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingSnap = await getDoc(ref);
      if (!existingSnap.exists()) {
        await setDoc(ref, {
          id: cleanId,
          name: plan.name.trim().slice(0, 60),
          tagline: plan.tagline.trim().slice(0, 160) || 'Managed SSD hosting plan.',
          monthlyPrice: Number(plan.monthlyPrice),
          storageGb: Math.max(1, Math.round(Number(plan.storageGb))),
          websiteLimit: Math.max(1, Math.round(Number(plan.websiteLimit))),
          features: cleanFeatures,
          isPopular: Boolean(plan.isPopular),
          isActive: Boolean(plan.isActive),
          sortOrder: Number(plan.sortOrder) || 10,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          name: plan.name.trim().slice(0, 60),
          tagline: plan.tagline.trim().slice(0, 160) || 'Managed SSD hosting plan.',
          monthlyPrice: Number(plan.monthlyPrice),
          storageGb: Math.max(1, Math.round(Number(plan.storageGb))),
          websiteLimit: Math.max(1, Math.round(Number(plan.websiteLimit))),
          features: cleanFeatures,
          isPopular: Boolean(plan.isPopular),
          isActive: Boolean(plan.isActive),
          sortOrder: Number(plan.sortOrder) || 10,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `hosting_plans/${cleanId}`);
  }
}

export async function removeHostingPlan(planId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'hosting_plans', planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `hosting_plans/${planId}`);
  }
}

export async function saveSubscriptionDiscount(discount: SubscriptionDiscount): Promise<void> {
  const ref = doc(db, 'subscription_discounts', discount.id);
  const clampedPct = Math.min(80, Math.max(0, Number(discount.discountPercentage) || 0));

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: discount.id,
        durationMonths: discount.durationMonths,
        label: discount.label.trim().slice(0, 40),
        discountPercentage: clampedPct,
        isActive: Boolean(discount.isActive),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        label: discount.label.trim().slice(0, 40),
        discountPercentage: clampedPct,
        isActive: Boolean(discount.isActive),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `subscription_discounts/${discount.id}`);
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const ref = doc(db, 'site_settings', 'main');
  try {
    const snap = await getDoc(ref);
    const payload = {
      companyName: settings.companyName.trim().slice(0, 80) || 'HostNova',
      tagline: settings.tagline.trim().slice(0, 160) || 'Powering Your Digital World.',
      companyEmail: settings.companyEmail.trim().slice(0, 200) || 'support@hostnova.com',
      companyPhone: settings.companyPhone.trim().slice(0, 40),
      companyAddress: settings.companyAddress.trim().slice(0, 240),
      logoUrl: settings.logoUrl.trim().slice(0, 300) || DEFAULT_SITE_SETTINGS.logoUrl,
      currency: 'USD' as const,
      updatedAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { id: 'main', ...payload });
    } else {
      await updateDoc(ref, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'site_settings/main');
  }
}
