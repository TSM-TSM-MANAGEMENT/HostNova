import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ExternalLink,
  FileText,
  Layers,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Server,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { useHostNova } from '../../context/HostNovaContext';
import { BRAND_LOGO_URL } from '../../lib/defaults';
import { AdminSection, OrderRecord } from '../../types/hostnova';
import { AdminOverviewSection } from './AdminOverviewSection';
import { AdminOrdersSection } from './AdminOrdersSection';
import {
  AdminCustomersSection,
  AdminHostingSection,
  AdminInvoicesSection,
  AdminPaymentsSection,
} from './AdminOperationsSections';
import { AdminPlansSection, AdminSettingsSection } from './AdminCatalogSections';

const SIDEBAR_ITEMS: { id: AdminSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'hosting', label: 'Hosting Services', icon: Server },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'plans', label: 'Hosting Plans', icon: Layers },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminDashboardPage() {
  const { user, authLoading, isAdmin, adminDataLoading, signOutUser, navigate } = useHostNova();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [inspectedOrder, setInspectedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [authLoading, user, isAdmin, navigate]);

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#060B18] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
      </div>
    );
  }

  const activeNavMeta = SIDEBAR_ITEMS.find((i) => i.id === section) || SIDEBAR_ITEMS[0];

  const handleSelectSection = (next: AdminSection) => {
    setSection(next);
    setMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    await signOutUser();
    navigate('/admin/login');
  };

  const handleInspectOrder = (order: OrderRecord) => {
    setInspectedOrder(order);
    setSection('orders');
  };

  return (
    <div className="min-h-screen bg-[#060B18] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-800 bg-[#080E1E] shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center bg-white rounded-md px-2 py-1 shrink-0"
              aria-label="HostNova Home"
            >
              <img
                src={BRAND_LOGO_URL}
                alt="HostNova Logo"
                referrerPolicy="no-referrer"
                className="h-7 w-auto object-contain"
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin sidebar">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            type="button"
            onClick={() => void handleLogout()}
            title={sidebarCollapsed ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/40 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-[#080E1E] border-r border-slate-800 flex flex-col">
            <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
              <span className="inline-flex items-center bg-white rounded-md px-2 py-1">
                <img
                  src={BRAND_LOGO_URL}
                  alt="HostNova Logo"
                  referrerPolicy="no-referrer"
                  className="h-7 w-auto object-contain"
                />
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Top Bar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-[#080E1E]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-500 hidden sm:inline">Admin</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <h1 className="font-bold text-white truncate">{activeNavMeta.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline text-xs text-slate-400 truncate max-w-[200px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {adminDataLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
              <span className="text-xs">Loading live Firestore records...</span>
            </div>
          ) : (
            <>
              {section === 'dashboard' && (
                <AdminOverviewSection
                  onNavigateSection={handleSelectSection}
                  onInspectOrder={handleInspectOrder}
                />
              )}
              {section === 'orders' && (
                <AdminOrdersSection
                  inspectedOrder={inspectedOrder}
                  onInspectOrder={setInspectedOrder}
                />
              )}
              {section === 'hosting' && <AdminHostingSection />}
              {section === 'customers' && <AdminCustomersSection />}
              {section === 'payments' && <AdminPaymentsSection />}
              {section === 'invoices' && <AdminInvoicesSection />}
              {section === 'plans' && <AdminPlansSection />}
              {section === 'settings' && <AdminSettingsSection />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
