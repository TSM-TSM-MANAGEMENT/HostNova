import { useState } from 'react';
import { ArrowRight, Globe2, Shield, Sparkles } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { VISUAL_ASSETS } from '../lib/defaults';

export function AboutPage() {
  const { navigate, settings } = useHostNova();
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-[#060B18]">
      <section className="py-16 sm:py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-wider text-blue-400 mb-3">
              About {settings.companyName}
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
              Built for international cloud hosting precision
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              {settings.companyName} — {settings.tagline} We deliver transparent USD subscription pricing, instant order confirmation, international checkout, automated corporate PDF invoicing, and dependable infrastructure management for modern teams.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0B1224] aspect-[16/9] max-h-[480px] w-full">
            {!imgError ? (
              <img
                src={VISUAL_ASSETS.globalOperations}
                alt="HostNova international cloud operations headquarters"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-12">
                <Globe2 className="w-14 h-14 text-blue-400" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-[#080E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7">
              <Globe2 className="w-6 h-6 text-blue-400 mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">International USD Standards</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Unified English-language storefront and USD billing calculations crafted for global developers, agencies, and digital teams.
              </p>
            </div>
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7">
              <Shield className="w-6 h-6 text-blue-400 mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Security &amp; Data Integrity</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Strict customer ownership boundaries, zero storage of sensitive payment card details, and immutable pricing snapshots on every confirmed order and invoice.
              </p>
            </div>
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7">
              <Sparkles className="w-6 h-6 text-blue-400 mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Transparent Operations</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Straightforward resource quotas, predictable multi-month discounts, and real-time account management without hidden renewal surprises.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              <span>Explore Hosting Plans</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
