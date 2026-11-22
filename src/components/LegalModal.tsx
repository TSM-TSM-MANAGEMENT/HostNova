import { X } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';

export function LegalModal() {
  const { legalModal, closeLegalModal, settings } = useHostNova();
  if (!legalModal) return null;

  const isTerms = legalModal === 'terms';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-[#0D1528] border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 id="legal-modal-title" className="text-lg font-bold text-white">
            {isTerms ? 'Terms of Service' : 'Privacy Policy'}
          </h2>
          <button
            type="button"
            onClick={closeLegalModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300 leading-relaxed">
          {isTerms ? (
            <>
              <p className="text-blue-300 font-medium">
                These Terms of Service govern your use of {settings.companyName} web hosting plans, billing portal, and account management services.
              </p>
              <h3 className="text-white font-semibold pt-2">1. Hosting Plans &amp; Billing Cycles</h3>
              <p>
                Subscription pricing is calculated in USD based on your selected plan and commitment period (1, 3, 6, 12, or 24 months). Multi-month discounts apply automatically at checkout and are itemized on your invoice.
              </p>
              <h3 className="text-white font-semibold pt-2">2. Service Provisioning &amp; Optional Metadata</h3>
              <p>
                Hosting services activate immediately upon order confirmation with defined SSD storage quotas and website limits. Linking a domain name or GitHub repository URL during checkout is optional and may be configured at any time.
              </p>
              <h3 className="text-white font-semibold pt-2">3. Immutable Pricing &amp; Invoicing</h3>
              <p>
                Confirmed orders and issued PDF invoices lock in the pricing snapshot at the time of purchase. Future adjustments to catalog rates do not retroactively alter historical orders or invoices.
              </p>
            </>
          ) : (
            <>
              <p className="text-blue-300 font-medium">
                {settings.companyName} protects customer privacy through strict data minimization and role-based access controls.
              </p>
              <h3 className="text-white font-semibold pt-2">1. Payment Card Security</h3>
              <p>
                Sensitive payment card details—including card numbers, expiration dates, and CVV codes—are never stored in our database or logs. Only billing metadata, payment method type, transaction reference, and invoice totals are retained.
              </p>
              <h3 className="text-white font-semibold pt-2">2. Account &amp; Order Isolation</h3>
              <p>
                Customer profiles, orders, invoices, and hosting records are isolated per authenticated user account so customers can access only their own billing and service information.
              </p>
              <h3 className="text-white font-semibold pt-2">3. Contact</h3>
              <p>
                For privacy or billing inquiries, contact {settings.companyEmail}.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={closeLegalModal}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
