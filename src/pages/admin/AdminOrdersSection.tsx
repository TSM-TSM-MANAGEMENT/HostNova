import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Eye,
  FileText,
  GitBranch,
  Globe,
  PauseCircle,
  PlayCircle,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useHostNova } from '../../context/HostNovaContext';
import { updateHostingAndOrderStatus } from '../../lib/database';
import { downloadInvoicePdf } from '../../lib/pdfInvoice';
import { formatDateTime, formatUSD } from '../../lib/pricing';
import { StatusBadge } from '../../components/StatusBadge';
import { HostingStatus, OrderRecord } from '../../types/hostnova';

interface AdminOrdersSectionProps {
  inspectedOrder: OrderRecord | null;
  onInspectOrder: (order: OrderRecord | null) => void;
}

const PAGE_SIZE = 10;

export function AdminOrdersSection({
  inspectedOrder,
  onInspectOrder,
}: AdminOrdersSectionProps) {
  const { allOrders, allInvoices, settings, navigate, notify, requestConfirm } = useHostNova();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [page, setPage] = useState(1);

  const uniquePlans = useMemo(
    () => Array.from(new Set(allOrders.map((o) => o.planNameSnapshot))).filter(Boolean),
    [allOrders]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = allOrders.filter((o) => {
      if (statusFilter !== 'ALL' && o.hostingStatus !== statusFilter) return false;
      if (planFilter !== 'ALL' && o.planNameSnapshot !== planFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.invoiceNumber.toLowerCase().includes(q) ||
        o.transactionId.toLowerCase().includes(q) ||
        o.domain.toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      if (sortBy === 'date_asc') return a.createdAt.getTime() - b.createdAt.getTime();
      if (sortBy === 'amount_desc') return b.finalTotal - a.finalTotal;
      if (sortBy === 'amount_asc') return a.finalTotal - b.finalTotal;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [allOrders, search, statusFilter, planFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Keep modal synced with latest Firestore snapshot
  const activeModalOrder = inspectedOrder
    ? allOrders.find((o) => o.id === inspectedOrder.id) || inspectedOrder
    : null;

  const handleStatusChange = (order: OrderRecord, nextStatus: HostingStatus, actionLabel: string) => {
    requestConfirm({
      title: `${actionLabel} for ${order.orderNumber}?`,
      description: `This will update the hosting status for ${order.customerName} (${order.planNameSnapshot}) to ${nextStatus} and persist immediately to Firestore.`,
      confirmLabel: actionLabel,
      variant: nextStatus === 'CANCELLED' || nextStatus === 'SUSPENDED' ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          await updateHostingAndOrderStatus(order.hostingDocId, order.id, nextStatus);
          notify('success', `Updated ${order.orderNumber} hosting status to ${nextStatus}.`);
        } catch {
          notify('error', 'Failed to update hosting status. Please retry.');
        }
      },
    });
  };

  const handleDownloadInvoice = async (order: OrderRecord) => {
    const inv = allInvoices.find((i) => i.id === order.invoiceId);
    if (!inv) {
      notify('error', 'Linked invoice document could not be located.');
      return;
    }
    try {
      await downloadInvoicePdf(inv, settings);
      notify('success', `Downloaded ${inv.invoiceNumber}.pdf`);
    } catch {
      notify('error', 'Failed to download PDF invoice.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order #, customer, email, domain, invoice..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by hosting status"
            className="px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by hosting plan"
            className="px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Plans</option>
            {uniquePlans.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort orders"
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              <option value="date_desc" className="bg-[#0B1224]">Newest First</option>
              <option value="date_asc" className="bg-[#0B1224]">Oldest First</option>
              <option value="amount_desc" className="bg-[#0B1224]">Amount High → Low</option>
              <option value="amount_asc" className="bg-[#0B1224]">Amount Low → High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No orders match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400 bg-[#080E1E]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order / Invoice</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Plan &amp; Specs</th>
                  <th className="py-3.5 px-4 font-semibold">Domain</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {paginated.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-blue-300 font-semibold">
                        {order.orderNumber}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {order.invoiceNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">
                        {order.planNameSnapshot} · {order.durationMonths}m
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {order.storageSnapshot} GB SSD · {order.websiteLimitSnapshot}{' '}
                        {order.websiteLimitSnapshot === 1 ? 'Site' : 'Sites'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {order.domain ? order.domain : 'No Domain Provided'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                      {formatUSD(order.finalTotal)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.hostingStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/invoice/${order.invoiceId}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 transition-colors"
                          title="View Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDownloadInvoice(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {order.hostingStatus === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order, 'SUSPENDED', 'Suspend Hosting')}
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 transition-colors"
                            title="Suspend Hosting"
                          >
                            <PauseCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                order,
                                'ACTIVE',
                                order.hostingStatus === 'SUSPENDED' ? 'Reactivate Hosting' : 'Activate Hosting'
                              )
                            }
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-colors"
                            title="Activate / Reactivate Hosting"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.hostingStatus !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order, 'CANCELLED', 'Cancel Hosting')}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                            title="Cancel Hosting"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="tabular-nums">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} orders
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            >
              Previous
            </button>
            <span className="font-mono text-slate-300 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {activeModalOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0D1528] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-mono">
                  {activeModalOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Placed {formatDateTime(activeModalOrder.createdAt)} · Confirmed Order Snapshot
                </p>
              </div>
              <button
                type="button"
                onClick={() => onInspectOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm tabular-nums">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#060B18] border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-500">Customer</div>
                  <div className="font-semibold text-white">{activeModalOrder.customerName}</div>
                  <div className="text-xs text-slate-400">{activeModalOrder.customerEmail}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#060B18] border border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-500">Statuses</div>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status={activeModalOrder.orderStatus} />
                    <StatusBadge status={activeModalOrder.hostingStatus} />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80 text-xs sm:text-sm">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Selected Plan</span>
                  <span className="text-white font-medium">
                    {activeModalOrder.planNameSnapshot} ({activeModalOrder.storageSnapshot} GB SSD ·{' '}
                    {activeModalOrder.websiteLimitSnapshot}{' '}
                    {activeModalOrder.websiteLimitSnapshot === 1 ? 'Website' : 'Websites'})
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Subscription Duration</span>
                  <span className="text-white">
                    {activeModalOrder.durationMonths} Months ({activeModalOrder.discountPercentage}% off)
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Base Monthly / Original Total</span>
                  <span className="font-mono text-slate-300">
                    {formatUSD(activeModalOrder.baseMonthlyPriceSnapshot)}/mo ·{' '}
                    {formatUSD(activeModalOrder.originalTotal)}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Discount / Final Paid</span>
                  <span className="font-mono text-blue-400 font-bold">
                    -{formatUSD(activeModalOrder.discountAmount)} → {formatUSD(activeModalOrder.finalTotal)}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-slate-400 inline-flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Domain
                  </span>
                  <span className="font-mono text-white">
                    {activeModalOrder.domain ? activeModalOrder.domain : 'No Domain Provided'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-slate-400 inline-flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" /> GitHub Repo
                  </span>
                  {activeModalOrder.githubRepository ? (
                    <a
                      href={activeModalOrder.githubRepository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-400 hover:underline truncate max-w-xs"
                    >
                      {activeModalOrder.githubRepository}
                    </a>
                  ) : (
                    <span className="text-slate-500">Not Provided</span>
                  )}
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="text-white">{activeModalOrder.paymentMethod}</span>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-slate-400">Transaction ID</span>
                  <span className="font-mono text-xs text-slate-200 break-all">
                    {activeModalOrder.transactionId}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Invoice Number</span>
                  <span className="font-mono text-xs text-blue-300">
                    {activeModalOrder.invoiceNumber}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/invoice/${activeModalOrder.invoiceId}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadInvoice(activeModalOrder)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                {activeModalOrder.hostingStatus !== 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        activeModalOrder,
                        'ACTIVE',
                        activeModalOrder.hostingStatus === 'SUSPENDED'
                          ? 'Reactivate Hosting'
                          : 'Activate Hosting'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>
                      {activeModalOrder.hostingStatus === 'SUSPENDED' ? 'Reactivate' : 'Activate'}
                    </span>
                  </button>
                )}
                {activeModalOrder.hostingStatus === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(activeModalOrder, 'SUSPENDED', 'Suspend Hosting')
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-xs font-semibold text-amber-300"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </button>
                )}
                {activeModalOrder.hostingStatus !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(activeModalOrder, 'CANCELLED', 'Cancel Hosting')
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600/30 text-xs font-semibold text-rose-300"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
