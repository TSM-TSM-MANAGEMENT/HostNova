import { useState } from 'react';
import { ArrowRight, CheckCircle2, GitBranch, HardDrive, Lock, Server } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { VISUAL_ASSETS } from '../lib/defaults';
import { PricingSection } from '../components/PricingSection';

export function WebHostingPage() {
  const { navigate } = useHostNova();
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-[#060B18]">
      {/* Header Banner */}
      <section className="border-b border-slate-800/80 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wider text-blue-400 mb-3">
                Managed SSD Web Hosting
              </p>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
                Infrastructure designed for modern web workloads
              </h1>
              <p className="text-base text-slate-300 leading-relaxed mb-8">
                Whether launching a single portfolio site or operating ten multi-region brand properties, HostNova provides transparent SSD capacity, predictable USD pricing, and instant provisioning.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#pricing-plans"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                >
                  <span>Compare Plans</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-sm font-semibold transition-colors"
                >
                  Open Price Calculator
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0B1224] aspect-[4/3] lg:h-full">
                {!imgError ? (
                  <img
                    src={VISUAL_ASSETS.serverRack}
                    alt="HostNova high-density enterprise SSD server array"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-10">
                    <Server className="w-12 h-12 text-blue-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="py-16 border-b border-slate-800/80 bg-[#080E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7">
              <HardDrive className="w-6 h-6 text-blue-400 mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Clear SSD Storage Tiers</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Start with 10 GB SSD on Basic, scale to 50 GB SSD on Pro, or deploy up to 100 GB SSD across 10 websites on Enterprise.
              </p>
            </div>
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7">
              <Lock className="w-6 h-6 text-blue-400 mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Free SSL &amp; Access Control</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every hosting plan includes a Free SSL Certificate and strict account isolation so each customer accesses only their own service records.
              </p>
            </div>
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7">
              <GitBranch className="w-6 h-6 text-blue-400 mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">GitHub Metadata Support</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Attach a validated HTTPS GitHub repository URL at checkout for clean project reference inside your order and hosting management records.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-xl bg-[#0B1224] border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-300">
                <strong className="text-white">Predictable Global Billing:</strong> Every plan locks in its discounted monthly rate for the full duration of your subscription with instant corporate PDF invoicing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <PricingSection defaultDuration={12} />
    </div>
  );
}
