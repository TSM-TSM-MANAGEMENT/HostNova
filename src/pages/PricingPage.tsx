import { useState } from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { PricingSection } from '../components/PricingSection';
import { calculatePricing, formatUSD, getDiscountForDuration } from '../lib/pricing';

export function PricingPage() {
  const { plans, discounts, selectPlanForCheckout } = useHostNova();
  const activePlans = plans.filter((p) => p.isActive);
  const activeDiscounts = discounts.filter((d) => d.isActive);

  const [calcPlanId, setCalcPlanId] = useState<string>(activePlans[0]?.id || 'basic');
  const [calcMonths, setCalcMonths] = useState<number>(3);

  const selectedPlan = activePlans.find((p) => p.id === calcPlanId) || activePlans[0];
  const selectedDiscount = getDiscountForDuration(activeDiscounts, calcMonths);

  const breakdown = selectedPlan
    ? calculatePricing(
        selectedPlan.monthlyPrice,
        selectedDiscount.durationMonths,
        selectedDiscount.discountPercentage
      )
    : null;

  return (
    <div className="bg-[#060B18]">
      {/* Page Intro */}
      <section className="border-b border-slate-800/80 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">
            USD Hosting Pricing
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Simple pricing with automatic duration savings
          </h1>
          <p className="text-base text-slate-400">
            Every total is dynamically computed from the plan&apos;s base monthly price and your chosen billing duration—zero hidden surcharges.
          </p>
        </div>
      </section>

      {/* Interactive Pricing Plans Grid */}
      <PricingSection compactHeading defaultDuration={12} />

      {/* Interactive Pricing Calculator Breakdown */}
      {selectedPlan && breakdown && (
        <section className="py-16 border-t border-slate-800/80 bg-[#080E1E]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-400 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Interactive Subscription Calculator</h2>
                <p className="text-sm text-slate-400">
                  Verify exact formula calculations for every hosting tier and commitment length.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0B1224] border border-slate-800 rounded-2xl p-6 sm:p-8">
              {/* Controls */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2.5">
                    1. Select Hosting Plan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {activePlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setCalcPlanId(plan.id)}
                        className={`p-3.5 rounded-xl border text-left transition-colors ${
                          selectedPlan.id === plan.id
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-sm">{plan.name}</div>
                        <div className="text-xs font-mono text-slate-400 mt-1 tabular-nums">
                          {formatUSD(plan.monthlyPrice)}/mo
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2.5">
                    2. Select Subscription Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeDiscounts.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setCalcMonths(d.durationMonths)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          selectedDiscount.durationMonths === d.durationMonths
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-[#060B18] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-sm">{d.label}</div>
                        <div className="text-xs text-emerald-400 mt-0.5 tabular-nums">
                          {d.discountPercentage}% discount
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed bg-[#060B18] border border-slate-800 rounded-xl p-4 font-mono">
                  <div>Formula:</div>
                  <div className="text-slate-300 mt-1">
                    Discounted Monthly = {formatUSD(breakdown.baseMonthlyPrice)} × (1 − {breakdown.discountPercentage}%) = {formatUSD(breakdown.discountedMonthlyPrice)}
                  </div>
                  <div className="text-blue-300 mt-1">
                    Final Payable = {formatUSD(breakdown.discountedMonthlyPrice)} × {breakdown.durationMonths} = {formatUSD(breakdown.finalTotal)}
                  </div>
                </div>
              </div>

              {/* Exact Summary Table */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-[#060B18] border border-slate-800 rounded-xl p-6">
                <div className="space-y-3.5 text-sm tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hosting Plan</span>
                    <span className="font-semibold text-white">
                      {selectedPlan.name} ({selectedPlan.storageGb} GB SSD · {selectedPlan.websiteLimit}{' '}
                      {selectedPlan.websiteLimit === 1 ? 'Site' : 'Sites'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Monthly Price</span>
                    <span className="font-mono text-slate-200">{formatUSD(breakdown.baseMonthlyPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subscription Duration</span>
                    <span className="text-slate-200">{selectedDiscount.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discount Percentage</span>
                    <span className="text-emerald-400 font-medium">{breakdown.discountPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discounted Monthly Price</span>
                    <span className="font-mono text-white font-semibold">
                      {formatUSD(breakdown.discountedMonthlyPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Original Total Price</span>
                    <span className="font-mono text-slate-400 line-through">
                      {formatUSD(breakdown.originalTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Savings</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {breakdown.discountAmount > 0 ? `-${formatUSD(breakdown.discountAmount)}` : '$0.00'}
                    </span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-base font-bold text-white">Final Payable Amount</span>
                    <span className="text-2xl font-extrabold font-mono text-blue-400">
                      {formatUSD(breakdown.finalTotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    selectPlanForCheckout(selectedPlan.id, selectedDiscount.durationMonths)
                  }
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
