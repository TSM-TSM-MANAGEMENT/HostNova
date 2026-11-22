import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { GlobalOverlays } from './components/GlobalOverlays';
import { Navbar } from './components/Navbar';
import { HostNovaProvider, useHostNova } from './context/HostNovaContext';
import { AboutPage } from './pages/AboutPage';
import { AccountPage } from './pages/AccountPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { InvoicePage } from './pages/InvoicePage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PricingPage } from './pages/PricingPage';
import { WebHostingPage } from './pages/WebHostingPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

function HostNovaRouter() {
  const { pathname } = useHostNova();

  // Separate Admin shell routes (no public navbar/footer)
  if (pathname === '/admin/login') {
    return <AdminLoginPage />;
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <AdminDashboardPage />;
  }

  // Dynamic parameter routes
  const successMatch = pathname.match(/^\/success\/([a-zA-Z0-9_-]+)$/);
  const invoiceMatch = pathname.match(/^\/invoice\/([a-zA-Z0-9_-]+)$/);

  let content = <HomePage />;
  if (pathname === '/hosting') {
    content = <WebHostingPage />;
  } else if (pathname === '/pricing') {
    content = <PricingPage />;
  } else if (pathname === '/about') {
    content = <AboutPage />;
  } else if (pathname === '/contact') {
    content = <ContactPage />;
  } else if (pathname === '/checkout') {
    content = <CheckoutPage />;
  } else if (pathname === '/account') {
    content = <AccountPage />;
  } else if (successMatch) {
    content = <PaymentSuccessPage orderId={successMatch[1]} />;
  } else if (invoiceMatch) {
    content = <InvoicePage invoiceId={invoiceMatch[1]} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060B18] text-slate-100">
      <Navbar />
      <main className="flex-1">{content}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HostNovaProvider>
        <HostNovaRouter />
        <GlobalOverlays />
      </HostNovaProvider>
    </ErrorBoundary>
  );
}
