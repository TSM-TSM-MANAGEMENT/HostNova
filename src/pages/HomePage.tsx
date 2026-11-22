import { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  GitBranch,
  Globe,
  HardDrive,
  Lock,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { VISUAL_ASSETS } from '../lib/defaults';
import { PricingSection } from '../components/PricingSection';
import { formatUSD } from '../lib/pricing';

const FAQS = [
  {
    q: 'How do multi-month subscription discounts work?',
    a: 'Every plan uses one transparent formula: Discounted Monthly Price = Base Monthly Price × (1 − Discount %), and Total = Discounted Monthly Price × Months. Choose 3 Months (3% off), 6 Months (7% off), 12 Months (15% off), or 24 Months (25% off).',
  },
  {
    q: 'How fast is hosting activation after checkout?',
    a: 'Activation is instant. As soon as your payment is confirmed, your hosting service transitions immediately to ACTIVE status with your allocated SSD storage, website limit, and renewal schedule.',
  },
  {
    q: 'Do I need a domain name before checking out?',
    a: 'No. The Domain Name field during checkout is completely optional. You may enter an existing domain name to attach to your hosting service, or leave it blank and configure a domain later.',
  },
  {
    q: 'How does GitHub compatibility work on HostNova?',
    a: 'During checkout, you may optionally attach a valid HTTPS GitHub repository URL (https://github.com/owner/repo). HostNova records it alongside your hosting plan and displays it in your order and service records for streamlined workflow tracking.',
  },
  {
    q: 'Do I receive an invoice immediately after payment?',
    a: 'Yes. Immediately upon completing checkout, HostNova confirms your order, activates your hosting service, generates a unique invoice number, and lets you view and download a formatted corporate PDF invoice.',
  },
];

export function HomePage() {
  const { navigate, plans, selectPlanForCheckout } = useHostNova();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroImgError, setHeroImgError] = useState(false);
  const [rackImgError, setRackImgError] = useState(false);

  const activePlans = plans.filter((p) => p.isActive);

  return (
    <div className="bg-[#060B18]">
      {/* A. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.12),_transparent_55%)]"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wider text-blue-400 mb-4">
                International SSD Cloud Hosting Platform
              </p>
              <h1
                className="font-extrabold text-white tracking-tight leading-[1.08] mb-6"
                style={{ fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)' }}
              >
                Powering Your Digital World.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8">
                Fast, secure and reliable hosting solutions for developers, businesses and growing brands. Transparent USD pricing, instant activation, and automated PDF billing.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/hosting')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span>Explore Hosting</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span>View Pricing</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0B1224] min-h-[280px] sm:min-h-[380px] lg:h-full">
                {!heroImgError ? (
                  <img
                    src={VISUAL_ASSETS.heroDatacenter}
                    alt="HostNova international tier-4 cloud data center server aisle"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0D1A36] to-[#060B18]">
                    <Server className="w-12 h-12 text-blue-400 mb-3" />
                    <p className="text-sm font-medium text-slate-300">HostNova Tier-4 Infrastructure</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060B18]/85 via-[#060B18]/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-200">
                  <div>
                    <p className="font-semibold text-white">NVMe SSD Compute Nodes</p>
                    <p className="text-slate-300">10 GB to 100 GB dedicated SSD allocations</p>
                  </div>
                  <div className="font-mono text-blue-300 tabular-nums">USD $15 – $45 / mo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Quantitative Strip below Hero Split */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">$15.00</p>
              <p className="text-xs text-slate-400 mt-1">Starting monthly base rate in USD</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">Up to 25%</p>
              <p className="text-xs text-slate-400 mt-1">Automatic 24-month commitment savings</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">10–100 GB</p>
              <p className="text-xs text-slate-400 mt-1">Pure SSD storage tiers across 3 plans</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">Instant</p>
              <p className="text-xs text-slate-400 mt-1">Instant activation &amp; PDF invoice issue</p>
            </div>
          </div>
        </div>
      </section>

      {/* B. HOSTING PLANS */}
      <PricingSection defaultDuration={12} />

      {/* C. WHY CHOOSE HOSTNOVA */}
      <section className="py-16 sm:py-20 border-t border-slate-800/80 bg-[#080E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">
                  Why Choose HostNova
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                  Engineered for clarity, speed, and dependable billing
                </h2>
                <p className="text-slate-400 text-base leading-relaxed mb-8">
                  HostNova removes hidden renewal gimmicks and bloated control panels. Choose your exact SSD storage, website count, and billing duration with crystal-clear math from checkout to invoice.
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0B1224] aspect-[4/3]">
                {!rackImgError ? (
                  <img
                    src={VISUAL_ASSETS.serverRack}
                    alt="Enterprise NVMe SSD server hardware blades"
                    referrerPolicy="no-referrer"
                    onError={() => setRackImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <HardDrive className="w-10 h-10 text-blue-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-blue-400">01. Performance</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-3">Pure SSD Architecture</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Every plan from Basic (10 GB) to Enterprise (100 GB) runs on high-throughput solid-state storage specifications designed for low-latency page delivery.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300 font-mono">
                  10 GB / 50 GB / 100 GB SSD
                </div>
              </div>

              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-blue-400">02. Billing Integrity</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-3">Immutable Invoice Snapshots</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Every confirmed order locks in its exact base monthly rate, discount percentage, and total payable amount so future catalog updates never alter past invoices.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300 font-mono">
                  Automatic Corporate PDF
                </div>
              </div>

              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-blue-400">03. Security First</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-3">Free SSL &amp; Zero Card Storage</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Every plan includes a Free SSL Certificate. Payment card numbers, expiry dates, and CVV codes are never persisted in our database or logs.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300 font-mono">
                  Free SSL Certificate Included
                </div>
              </div>

              <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-blue-400">04. Developer Ready</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-3">Optional Domain &amp; GitHub Metadata</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Attach an existing domain or HTTPS GitHub repository URL at checkout—or start immediately with zero domain required and update later.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-300 font-mono">
                  HTTPS GitHub Validation
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. HOSTING FEATURES */}
      <section className="py-16 sm:py-20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">
              Core Platform Features
            </p>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
              Everything required to run modern websites cleanly
            </h2>
            <p className="text-slate-400 text-base">
              Practical resource allocations, clear documentation, and instant administrative visibility across every hosting lifecycle state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {[
              {
                icon: Zap,
                title: 'Instant Service Activation',
                desc: 'Orders transition directly to CONFIRMED with ACTIVE hosting status and calculated start and renewal dates.',
              },
              {
                icon: ShieldCheck,
                title: 'Free SSL Certificate Across All Tiers',
                desc: 'Included at no extra cost on Basic, Pro, and Enterprise plans for encrypted HTTPS connections.',
              },
              {
                icon: Globe,
                title: 'Flexible Optional Domain Support',
                desc: 'Checkout with your existing domain name or leave the field blank without blocking order confirmation.',
              },
              {
                icon: HardDrive,
                title: 'Dedicated SSD Quotas',
                desc: 'Explicit storage ceilings (10 GB, 50 GB, 100 GB) and website caps (1, 2, 10) tracked per service record.',
              },
              {
                icon: Lock,
                title: 'Isolated Customer Access',
                desc: 'Strict database-level ownership enforcement ensures customers view only their own orders and invoices.',
              },
              {
                icon: Server,
                title: 'Full Lifecycle Administration',
                desc: 'Authorized administrators can inspect orders, download invoices, and activate, suspend, reactivate, or cancel services.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* E. GITHUB COMPATIBILITY */}
      <section className="py-16 sm:py-20 border-t border-slate-800/80 bg-[#080E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#0E1833] to-[#0B1224] border border-slate-800 p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <GitBranch className="w-4 h-4" />
                  <span>GitHub Workflow Compatibility</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Built with developer repositories in mind
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Attach any public or private HTTPS GitHub repository URL during checkout so your project metadata stays organized alongside your hosting service and administrative records.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Attach any validated HTTPS GitHub URL (`https://github.com/owner/repo`) directly at checkout to keep source repository links synced with your hosting records.
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="rounded-xl bg-[#060B18] border border-slate-800 p-5 font-mono text-xs space-y-3">
                  <div className="text-slate-400">Checkout Repository Reference</div>
                  <div className="px-3 py-2.5 rounded-lg bg-[#0D1528] border border-slate-700 text-blue-300 truncate">
                    https://github.com/hostnova/web-app
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] text-slate-400">
                    <div>
                      <span className="block text-slate-500">Validation</span>
                      <span className="text-emerald-400">HTTPS GitHub URL</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Visibility</span>
                      <span className="text-slate-200">Order &amp; Admin Panel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* F. SIMPLE PRICING COMPARISON */}
      <section className="py-16 sm:py-20 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">
              Side-by-Side Comparison
            </p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Simple, transparent specifications
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0B1224]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="py-4 px-6">Specification</th>
                  {activePlans.map((plan) => (
                    <th key={plan.id} className="py-4 px-6 text-white">
                      {plan.name}
                      {plan.isPopular && (
                        <span className="ml-2 text-[11px] font-medium text-blue-400">Popular</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                <tr>
                  <td className="py-4 px-6 text-slate-400">Base Monthly Price</td>
                  {activePlans.map((plan) => (
                    <td key={plan.id} className="py-4 px-6 font-mono font-semibold text-white tabular-nums">
                      {formatUSD(plan.monthlyPrice)} / mo
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-slate-400">SSD Storage</td>
                  {activePlans.map((plan) => (
                    <td key={plan.id} className="py-4 px-6 text-slate-200 tabular-nums">
                      {plan.storageGb} GB SSD
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-slate-400">Website Limit</td>
                  {activePlans.map((plan) => (
                    <td key={plan.id} className="py-4 px-6 text-slate-200 tabular-nums">
                      {plan.websiteLimit} {plan.websiteLimit === 1 ? 'Website' : 'Websites'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-slate-400">SSL Certificate</td>
                  {activePlans.map((plan) => (
                    <td key={plan.id} className="py-4 px-6 text-slate-200">
                      Free SSL Certificate
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-slate-400">GitHub Support</td>
                  {activePlans.map((plan) => (
                    <td key={plan.id} className="py-4 px-6 text-slate-200">
                      {plan.id === 'basic' ? 'GitHub Support' : 'GitHub Integration Support'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-6 text-slate-400">Action</td>
                  {activePlans.map((plan) => (
                    <td key={plan.id} className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => selectPlanForCheckout(plan.id, 12)}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
                      >
                        Configure {plan.name} →
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* G. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-20 border-t border-slate-800/80 bg-[#080E1E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-800 border-t border-b border-slate-800">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full py-5 flex items-center justify-between gap-4 text-left text-base font-semibold text-white hover:text-blue-300 transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-5 pr-8 text-sm text-slate-400 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* H. FINAL CALL TO ACTION */}
      <section className="py-16 sm:py-24 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-[#0B1224] border border-blue-500/30 p-10 sm:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Ready to launch your next digital project?
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-base mb-8">
              Select a Basic, Pro, or Enterprise hosting plan, pick your preferred billing duration, complete checkout, and download your corporate PDF invoice in seconds.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <button
                type="button"
                onClick={() => selectPlanForCheckout('pro', 12)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>Start with Pro Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>Contact Sales</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
