import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  GitBranch,
  Globe,
  Loader2,
  Lock,
  Wallet,
} from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { submitDemoOrderAtomic } from '../lib/database';
import {
  calculatePricing,
  formatUSD,
  getDiscountForDuration,
  validateDomainName,
  validateEmail,
  validateGitHubRepoUrl,
} from '../lib/pricing';
import { CardBrandOption, PaymentCategory } from '../types/hostnova';

const CARD_BRANDS: CardBrandOption[] = [
  'Visa',
  'Mastercard',
  'American Express',
  'Discover',
  'Debit Card',
  'Credit Card',
];

export function CheckoutPage() {
  const {
    user,
    authLoading,
    signInWithGoogle,
    plans,
    discounts,
    selectedPlanId,
    selectedDurationMonths,
    setSelectedPlanId,
    setSelectedDurationMonths,
    navigate,
    notify,
  } = useHostNova();

  const activePlans = plans.filter((p) => p.isActive);
  const activeDiscounts = discounts.filter((d) => d.isActive);

  const selectedPlan =
    activePlans.find((p) => p.id === selectedPlanId) || activePlans[0];
  const selectedDiscount = getDiscountForDuration(activeDiscounts, selectedDurationMonths);

  // Customer Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  // Payment Selection
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('CARD');
  const [cardBrand, setCardBrand] = useState<CardBrandOption>('Visa');

  // Simulated card fields — strictly transient in memory, NEVER sent or stored
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // PayPal / Bank Transfer transient reference
  const [paypalAccountEmail, setPaypalAccountEmail] = useState('');
  const [bankWireRef, setBankWireRef] = useState('HOSTNOVA-WIRE-REF');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingLockRef = useRef(false);

  // Pre-fill authenticated customer details once available
  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
      setCardholderName((prev) => prev || user.displayName || '');
      setPaypalAccountEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  if (!selectedPlan) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-slate-300">
        No active hosting plans are currently available.
      </div>
    );
  }

  const pricing = calculatePricing(
    selectedPlan.monthlyPrice,
    selectedDiscount.durationMonths,
    selectedDiscount.discountPercentage
  );

  const getPaymentMethodLabel = (): string => {
    if (paymentCategory === 'CARD') return `Card (${cardBrand})`;
    if (paymentCategory === 'PAYPAL') return 'PayPal';
    return 'Bank Transfer';
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingLockRef.current || isSubmitting) return;

    setSubmitError(null);
    const nextErrors: Record<string, string> = {};

    // STEP 1: Validate customer details
    if (!fullName.trim() || fullName.trim().length < 2) {
      nextErrors.fullName = 'Full Name is required.';
    }
    if (!validateEmail(email)) {
      nextErrors.email = 'A valid Email Address is required.';
    }

    const domainCheck = validateDomainName(domain);
    if (!domainCheck.valid && domainCheck.error) {
      nextErrors.domain = domainCheck.error;
    }

    const repoCheck = validateGitHubRepoUrl(githubRepo);
    if (!repoCheck.valid && repoCheck.error) {
      nextErrors.githubRepo = repoCheck.error;
    }

    // Validate payment fields (accept any non-empty billing details)
    if (paymentCategory === 'CARD') {
      if (!cardholderName.trim()) {
        nextErrors.cardholderName = 'Cardholder Name is required.';
      }
      if (!cardNumber.trim()) {
        nextErrors.cardNumber = 'Card Number is required.';
      }
      if (!expiryDate.trim()) {
        nextErrors.expiryDate = 'Expiry Date is required.';
      }
      if (!cvv.trim()) {
        nextErrors.cvv = 'CVV is required.';
      }
    } else if (paymentCategory === 'PAYPAL') {
      if (!paypalAccountEmail.trim()) {
        nextErrors.paypalAccountEmail = 'PayPal Account Email is required.';
      }
    } else if (paymentCategory === 'BANK_TRANSFER') {
      if (!bankWireRef.trim()) {
        nextErrors.bankWireRef = 'Wire Transfer Reference is required.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      notify('error', 'Please review the highlighted checkout fields.');
      return;
    }

    // Ensure authenticated verified customer session
    let activeUser = user;
    if (!activeUser) {
      activeUser = await signInWithGoogle();
      if (!activeUser) return;
    }

    submittingLockRef.current = true;
    setIsSubmitting(true);

    // Immediately discard all transient card inputs before any network call
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');

    try {
      const result = await submitDemoOrderAtomic({
        customerId: activeUser.uid,
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        plan: selectedPlan,
        discount: selectedDiscount,
        domain: domainCheck.normalized,
        githubRepository: repoCheck.normalized,
        paymentMethodLabel: getPaymentMethodLabel(),
      });

      notify('success', `Order ${result.order.orderNumber} confirmed! Hosting is now ACTIVE.`);
      navigate(`/success/${result.order.id}`);
    } catch (err) {
      console.error('Order confirmation failed:', err);
      setSubmitError(
        'Database confirmation failed. No incomplete active service was created. Please verify your connection and retry.'
      );
      notify('error', 'Order confirmation failed. You can safely retry.');
    } finally {
      submittingLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#060B18] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">
            Secure Checkout
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Complete your HostNova order
          </h1>
        </div>

        {/* Auth Prompt if Not Signed In */}
        {!authLoading && !user && (
          <div className="mb-8 rounded-xl bg-[#0D1528] border border-slate-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Sign in to attach this order to your account</h2>
              <p className="text-xs text-slate-400 mt-1">
                Signing in with Google secures your private invoices and hosting records so only you and authorized administrators can access them.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Sign in with Google
            </button>
          </div>
        )}

        <form onSubmit={handleCheckoutSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Configuration, Customer Info & Payment */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Plan & Duration Selection */}
              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5">
                <h2 className="text-lg font-bold text-white">1. Plan &amp; Subscription Duration</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activePlans.map((plan) => {
                    const active = plan.id === selectedPlan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          active
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm">{plan.name}</span>
                          {plan.isPopular && (
                            <span className="text-[10px] font-semibold text-blue-400">Popular</span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-slate-300 mt-1 tabular-nums">
                          {formatUSD(plan.monthlyPrice)}/mo
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {plan.storageGb} GB SSD · {plan.websiteLimit}{' '}
                          {plan.websiteLimit === 1 ? 'Site' : 'Sites'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Subscription Duration
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activeDiscounts.map((d) => {
                      const active = d.durationMonths === selectedDiscount.durationMonths;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDurationMonths(d.durationMonths)}
                          className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                            active
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {d.label}
                          {d.discountPercentage > 0 ? ` (-${d.discountPercentage}%)` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Customer Information */}
              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5">
                <h2 className="text-lg font-bold text-white">2. Customer Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      maxLength={120}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jordan Taylor"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-rose-400">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      required
                      maxLength={200}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-domain" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Domain Name <span className="text-slate-500">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        id="checkout-domain"
                        type="text"
                        maxLength={253}
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="yourdomain.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {errors.domain ? (
                      <p className="mt-1 text-xs text-rose-400">{errors.domain}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Leave blank if you do not have a domain yet.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-github" className="block text-xs font-medium text-slate-300 mb-1.5">
                      GitHub Repository URL <span className="text-slate-500">(Optional)</span>
                    </label>
                    <div className="relative">
                      <GitBranch className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        id="checkout-github"
                        type="url"
                        maxLength={300}
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {errors.githubRepo ? (
                      <p className="mt-1 text-xs text-rose-400">{errors.githubRepo}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Informational HTTPS GitHub repository reference.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Payment Method */}
              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-white">3. Payment Method</h2>
                  <span className="text-xs font-mono text-blue-400">USD ($)</span>
                </div>

                {/* Category Tabs */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentCategory('CARD')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                      paymentCategory === 'CARD'
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentCategory('PAYPAL')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                      paymentCategory === 'PAYPAL'
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span>PayPal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentCategory('BANK_TRANSFER')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                      paymentCategory === 'BANK_TRANSFER'
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Bank Transfer</span>
                  </button>
                </div>

                {/* CARD FORM */}
                {paymentCategory === 'CARD' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">
                        Select Card Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CARD_BRANDS.map((brand) => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setCardBrand(brand)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                              cardBrand === brand
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="card-holder" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Cardholder Name *
                      </label>
                      <input
                        id="card-holder"
                        type="text"
                        autoComplete="off"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="Jordan Taylor"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {errors.cardholderName && (
                        <p className="mt-1 text-xs text-rose-400">{errors.cardholderName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="card-number" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Card Number *
                      </label>
                      <input
                        id="card-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4000 1234 5678 9010"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {errors.cardNumber && (
                        <p className="mt-1 text-xs text-rose-400">{errors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="card-expiry" className="block text-xs font-medium text-slate-300 mb-1.5">
                          Expiry Date *
                        </label>
                        <input
                          id="card-expiry"
                          type="text"
                          autoComplete="off"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          placeholder="12/29"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        {errors.expiryDate && (
                          <p className="mt-1 text-xs text-rose-400">{errors.expiryDate}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="card-cvv" className="block text-xs font-medium text-slate-300 mb-1.5">
                          CVV *
                        </label>
                        <input
                          id="card-cvv"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        {errors.cvv && (
                          <p className="mt-1 text-xs text-rose-400">{errors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYPAL */}
                {paymentCategory === 'PAYPAL' && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Fast checkout using your PayPal billing email address.
                    </p>
                    <div>
                      <label htmlFor="paypal-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                        PayPal Account Email *
                      </label>
                      <input
                        id="paypal-email"
                        type="text"
                        value={paypalAccountEmail}
                        onChange={(e) => setPaypalAccountEmail(e.target.value)}
                        placeholder="buyer@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {errors.paypalAccountEmail && (
                        <p className="mt-1 text-xs text-rose-400">{errors.paypalAccountEmail}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* BANK TRANSFER */}
                {paymentCategory === 'BANK_TRANSFER' && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      International wire transfer confirmation. Enter your transfer reference below.
                    </p>
                    <div>
                      <label htmlFor="bank-ref" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Wire Transfer Reference *
                      </label>
                      <input
                        id="bank-ref"
                        type="text"
                        value={bankWireRef}
                        onChange={(e) => setBankWireRef(e.target.value)}
                        placeholder="HOSTNOVA-WIRE-REF"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {errors.bankWireRef && (
                        <p className="mt-1 text-xs text-rose-400">{errors.bankWireRef}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Card numbers, expiry dates, and CVV inputs are discarded immediately and never persisted.</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky Order Summary */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5">
                <h2 className="text-lg font-bold text-white">Order Summary</h2>

                <div className="space-y-3 text-sm tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Selected Plan</span>
                    <span className="font-semibold text-white">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SSD Storage</span>
                    <span className="text-slate-200">{selectedPlan.storageGb} GB SSD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Website Limit</span>
                    <span className="text-slate-200">
                      {selectedPlan.websiteLimit}{' '}
                      {selectedPlan.websiteLimit === 1 ? 'Website' : 'Websites'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subscription Duration</span>
                    <span className="text-slate-200">{selectedDiscount.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Monthly Price</span>
                    <span className="font-mono text-slate-200">
                      {formatUSD(pricing.baseMonthlyPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discounted Monthly</span>
                    <span className="font-mono text-slate-200">
                      {formatUSD(pricing.discountedMonthlyPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Original Total</span>
                    <span className="font-mono text-slate-400">
                      {formatUSD(pricing.originalTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Discount ({pricing.discountPercentage}%)
                    </span>
                    <span className="font-mono text-emerald-400 font-medium">
                      {pricing.discountAmount > 0 ? `-${formatUSD(pricing.discountAmount)}` : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Method</span>
                    <span className="text-slate-200">{getPaymentMethodLabel()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between tabular-nums">
                  <div>
                    <span className="text-base font-bold text-white">Final Total</span>
                    <span className="block text-[11px] text-slate-500">Billed in USD ($)</span>
                  </div>
                  <span className="text-3xl font-extrabold font-mono text-blue-400">
                    {formatUSD(pricing.finalTotal)}
                  </span>
                </div>

                {submitError && (
                  <div className="rounded-xl bg-rose-950/50 border border-rose-500/40 p-3.5 flex items-start gap-2.5 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pay Now — {formatUSD(pricing.finalTotal)}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500 leading-relaxed">
                  Clicking Pay Now confirms your order, activates your hosting service, and generates your downloadable PDF invoice immediately.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
