import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { calculatePricing, formatUSD, getDiscountForDuration } from '../lib/pricing';

interface PricingSectionProps {
  compactHeading?: boolean;
  defaultDuration?: number;
}

export function PricingSection({ compactHeading = false, defaultDuration = 12 }: PricingSectionProps) {
  const { plans, discounts, selectPlanForCheckout } = useHostNova();
  const activePlans = plans.filter((p) => p.isActive);
  const activeDiscounts = discounts.filter((d) => d.isActive);

  const [durationMonths, setDurationMonths] = useState<number>(defaultDuration);
  const selectedDiscount = getDiscountForDuration(activeDiscounts, durationMonths);

  return (
    <section id="pricing-plans" className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!compactHeading && (
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">
              Transparent USD Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Predictable hosting plans that scale with your workload
            </h2>
            <p className="text-slate-400 text-base">
              Select a subscription duration below to preview automatic multi-month savings calculated directly from each plan&apos;s base monthly rate.
            </p>
          </div>
        )}

        {/* Interactive Duration Selector */}
        <div className="flex flex-col items-center mb-12">
          <div
            className="inline-flex flex-wrap justify-center items-center gap-1.5 p-1.5 rounded-xl bg-[#0D1528] border border-slate-800"
            role="tablist"
            aria-label="Subscription Duration"
          >
            {activeDiscounts.map((d) => {
              const isSelected = d.durationMonths === selectedDiscount.durationMonths;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setDurationMonths(d.durationMonths)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <span>{d.label}</span>
                  {d.discountPercentage > 0 && (
                    <span
                      className={`ml-1.5 text-xs tabular-nums ${
                        isSelected ? 'text-blue-100' : 'text-emerald-400'
                      }`}
                    >
                      -{d.discountPercentage}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400 tabular-nums">
            {selectedDiscount.discountPercentage > 0
              ? `Saving ${selectedDiscount.discountPercentage}% off the base monthly price on a ${selectedDiscount.label} commitment.`
              : 'Standard monthly billing with 0% multi-month discount. Select 3–24 months to save up to 25%.'}
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {activePlans.map((plan) => {
            const breakdown = calculatePricing(
              plan.monthlyPrice,
              selectedDiscount.durationMonths,
              selectedDiscount.discountPercentage
            );

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-7 transition-colors ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-[#111D3A] to-[#0B1224] border-2 border-blue-500/80 shadow-xl shadow-blue-950/30'
                    : 'bg-[#0B1224] border border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="text-xs font-semibold text-blue-400 whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-400 mb-6 min-h-[40px]">{plan.tagline}</p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-800/80">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                      {formatUSD(breakdown.discountedMonthlyPrice)}
                    </span>
                    <span className="text-sm text-slate-400">/ month</span>
                  </div>

                  {breakdown.discountPercentage > 0 ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 tabular-nums">
                      <span className="line-through text-slate-500">
                        {formatUSD(breakdown.baseMonthlyPrice)}/mo
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400 font-medium">
                        Save {formatUSD(breakdown.discountAmount)} ({breakdown.discountPercentage}%)
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-500 tabular-nums">
                      Base monthly rate · No lock-in
                    </div>
                  )}

                  {/* Full Transparent Breakdown */}
                  <div className="mt-5 space-y-2 text-xs text-slate-300 bg-[#060B18]/70 rounded-xl p-4 border border-slate-800/70 tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration</span>
                      <span className="font-medium text-white">{selectedDiscount.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Original Total</span>
                      <span className={breakdown.discountAmount > 0 ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {formatUSD(breakdown.originalTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Savings</span>
                      <span className="text-emerald-400 font-medium">
                        {breakdown.discountAmount > 0 ? `-${formatUSD(breakdown.discountAmount)}` : '$0.00'}
                      </span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between text-sm font-semibold">
                      <span className="text-white">Final Payable</span>
                      <span className="text-blue-400 font-mono">{formatUSD(breakdown.finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Spec Summary */}
                <div className="flex items-center gap-3 text-xs text-slate-300 mb-5 tabular-nums">
                  <span className="font-semibold text-white">{plan.storageGb} GB SSD</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-semibold text-white">
                    {plan.websiteLimit} {plan.websiteLimit === 1 ? 'Website' : 'Websites'}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => selectPlanForCheckout(plan.id, selectedDiscount.durationMonths)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                    plan.isPopular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
