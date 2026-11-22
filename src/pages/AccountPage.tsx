import { Download, FileText, LogOut, Plus, Server } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { formatDateShort, formatUSD } from '../lib/pricing';
import { downloadInvoicePdf } from '../lib/pdfInvoice';
import { StatusBadge } from '../components/StatusBadge';

export function AccountPage() {
  const {
    user,
    authLoading,
    isAdmin,
    signInWithGoogle,
    signOutUser,
    myOrders,
    myInvoices,
    myHostingServices,
    settings,
    navigate,
    notify,
  } = useHostNova();

  if (authLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400">Loading account...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0B1224] border border-slate-800 rounded-2xl p-8 text-center space-y-5">
          <h1 className="text-2xl font-bold text-white">Customer Portal</h1>
          <p className="text-sm text-slate-400">
            Sign in with Google to view your private hosting services, order history, and downloadable PDF invoices.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#060B18] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">Customer Account</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {user.displayName || user.email}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Open Admin Panel
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Hosting Order</span>
            </button>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Hosting Services */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">My Hosting Services ({myHostingServices.length})</h2>
          {myHostingServices.length === 0 ? (
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-8 text-center">
              <Server className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">No hosting services yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Choose a plan and complete checkout to activate your first hosting service.
              </p>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                View Hosting Plans
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#0B1224] border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-xs text-slate-400">
                  <tr>
                    <th className="py-3.5 px-5">Hosting ID</th>
                    <th className="py-3.5 px-5">Plan</th>
                    <th className="py-3.5 px-5">Resources</th>
                    <th className="py-3.5 px-5">Domain</th>
                    <th className="py-3.5 px-5">Renewal Date</th>
                    <th className="py-3.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 tabular-nums">
                  {myHostingServices.map((hs) => (
                    <tr key={hs.id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-5 font-mono text-xs text-blue-300">{hs.hostingId}</td>
                      <td className="py-3.5 px-5 font-medium text-white">{hs.planName}</td>
                      <td className="py-3.5 px-5 text-slate-300 text-xs">
                        {hs.storageGb} GB SSD · {hs.websiteLimit} {hs.websiteLimit === 1 ? 'Site' : 'Sites'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-300">
                        {hs.domain ? hs.domain : 'No Domain Provided'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-400">{hs.renewalDate}</td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={hs.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Orders & Invoices */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">My Orders &amp; Invoices ({myOrders.length})</h2>
          {myOrders.length === 0 ? (
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-400">
              Your confirmed orders and downloadable PDF invoices will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#0B1224] border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-xs text-slate-400">
                  <tr>
                    <th className="py-3.5 px-5">Order / Invoice</th>
                    <th className="py-3.5 px-5">Plan &amp; Duration</th>
                    <th className="py-3.5 px-5 text-right">Amount</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 tabular-nums">
                  {myOrders.map((order) => {
                    const inv = myInvoices.find((i) => i.id === order.invoiceId);
                    return (
                      <tr key={order.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-5">
                          <div className="font-mono text-xs text-white">{order.orderNumber}</div>
                          <div className="font-mono text-[11px] text-slate-500">{order.invoiceNumber}</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-200">
                          {order.planNameSnapshot} · {order.durationMonths}m
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-semibold text-white">
                          {formatUSD(order.finalTotal)}
                        </td>
                        <td className="py-3.5 px-5">
                          <StatusBadge status={order.hostingStatus} />
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-400">
                          {formatDateShort(order.createdAt)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/invoice/${order.invoiceId}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </button>
                            {inv && (
                              <button
                                type="button"
                                onClick={() => {
                                  void downloadInvoicePdf(inv, settings).then(() =>
                                    notify('success', `Downloaded ${inv.invoiceNumber}.pdf`)
                                  );
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-xs text-blue-300 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
