import { Mail, MapPin, Phone } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { BRAND_LOGO_URL } from '../lib/defaults';

export function Footer() {
  const { navigate, plans, settings, openLegalModal, selectPlanForCheckout } = useHostNova();
  const activePlans = plans.filter((p) => p.isActive);

  return (
    <footer className="bg-[#050914] border-t border-slate-800/80 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center bg-white rounded-md px-3 py-1.5"
              aria-label="HostNova Home"
            >
              <img
                src={BRAND_LOGO_URL}
                alt="HostNova Logo"
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain"
              />
            </button>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings.tagline} High-speed SSD hosting architecture designed for developers, startups, and international teams.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Global cloud infrastructure with transparent USD pricing, SSD performance, and automated billing.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Home', path: '/' },
                { label: 'Web Hosting', path: '/hosting' },
                { label: 'Pricing Calculator', path: '/pricing' },
                { label: 'About HostNova', path: '/about' },
                { label: 'Contact Us', path: '/contact' },
                { label: 'Admin Portal', path: '/admin/login' },
              ].map((link) => (
                <li key={link.path}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Hosting Plans */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Hosting Plans</h3>
            <ul className="space-y-2.5 text-sm">
              {activePlans.map((plan) => (
                <li key={plan.id}>
                  <button
                    type="button"
                    onClick={() => selectPlanForCheckout(plan.id, 12)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {plan.name} — ${plan.monthlyPrice.toFixed(2)}/mo · {plan.storageGb} GB SSD
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/account')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Customer Orders & Invoices
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Contact Information</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span>{settings.companyEmail}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span>{settings.companyPhone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span>{settings.companyAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => openLegalModal('terms')}
              className="hover:text-slate-200 transition-colors"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => openLegalModal('privacy')}
              className="hover:text-slate-200 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
