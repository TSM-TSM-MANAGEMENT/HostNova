import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { BRAND_LOGO_URL } from '../lib/defaults';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Web Hosting', path: '/hosting' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export function Navbar() {
  const { pathname, navigate, user, isAdmin } = useHostNova();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLink = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#060B18]/92 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo */}
        <button
          type="button"
          onClick={() => handleLink('/')}
          className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          aria-label="HostNova Home"
        >
          <span className="inline-flex items-center bg-white rounded-md px-2.5 py-1 shadow-sm">
            <img
              src={BRAND_LOGO_URL}
              alt="HostNova — Powering Your Digital World"
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain"
            />
          </span>
        </button>

        {/* Zone 2: Primary Navigation (5 concise single-line links) */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleLink(item.path)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
                  active
                    ? 'text-white border-blue-500'
                    : 'text-slate-300 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => handleLink(isAdmin ? '/admin' : '/account')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {isAdmin ? 'Admin Panel' : 'My Account'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleLink('/admin/login')}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Login
            </button>
          )}
          <button
            type="button"
            onClick={() => handleLink('/pricing')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Get Started
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0A1124] px-4 py-4 space-y-2">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleLink(item.path)}
                className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-600/15 text-blue-400' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-3 mt-2 border-t border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleLink(user ? (isAdmin ? '/admin' : '/account') : '/admin/login')}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 text-center transition-colors"
            >
              {user ? (isAdmin ? 'Admin Panel' : 'My Account') : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => handleLink('/pricing')}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 text-center transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
