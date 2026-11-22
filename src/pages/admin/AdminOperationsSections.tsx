import { useMemo, useState } from 'react';
import { Download, FileText, GitBranch, Search } from 'lucide-react';
import { useHostNova } from '../../context/HostNovaContext';
import { updateHostingAndOrderStatus } from '../../lib/database';
import { downloadInvoicePdf } from '../../lib/pdfInvoice';
import { formatDateShort, formatDateTime, formatUSD } from '../../lib/pricing';
import { StatusBadge } from '../../components/StatusBadge';
import { HostingServiceRecord, HostingStatus } from '../../types/hostnova';

const HOSTING_STATUSES: HostingStatus[] = ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'];

export function AdminHostingSection() {
  const { allHostingServices, notify, requestConfirm } = useHostNova();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allHostingServices.filter((h) => {
      if (statusFilter !== 'ALL' && h.status !== statusFilter) return false;
      if (!q) return true;
      return (
        h.hostingId.toLowerCase().includes(q) ||
        h.customerName.toLowerCase().includes(q) ||
        h.planName.toLowerCase().includes(q) ||
        h.domain.toLowerCase().includes(q)
      );
    });
  }, [allHostingServices, search, statusFilter]);

  const handleStatusSelect = (service: HostingServiceRecord, nextStatus: HostingStatus) => {
    if (nextStatus === service.status) return;
    requestConfirm({
      title: `Change status of ${service.hostingId} to ${nextStatus}?`,
      description: `Customer: ${service.customerName} (${service.planName}). This status update takes effect immediately.`,
      confirmLabel: `Set ${nextStatus}`,
      variant: nextStatus === 'CANCELLED' || nextStatus === 'SUSPENDED' ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          await updateHostingAndOrderStatus(service.id, service.orderId, nextStatus);
          notify('success', `Hosting ${service.hostingId} updated to ${nextStatus}.`);
        } catch {
          notify('error', 'Failed to update hosting status.');
        }
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hosting ID, customer, plan, domain..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter hosting services by status"
          className="px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          {HOSTING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No hosting services found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400 bg-[#080E1E]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Hosting ID</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Plan / Specs</th>
                  <th className="py-3.5 px-4 font-semibold">Domain &amp; GitHub</th>
                  <th className="py-3.5 px-4 font-semibold">Start / Renewal</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {filtered.map((hs) => (
                  <tr key={hs.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-300 whitespace-nowrap">
                      {hs.hostingId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{hs.customerName}</div>
                      <div className="text-[11px] text-slate-500">{hs.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{hs.planName}</div>
                      <div className="text-[11px] text-slate-500">
                        {hs.storageGb} GB SSD · {hs.websiteLimit} {hs.websiteLimit === 1 ? 'Site' : 'Sites'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-200">
                        {hs.domain ? hs.domain : 'No Domain Provided'}
                      </div>
                      {hs.githubRepository && (
                        <a
                          href={hs.githubRepository}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-0.5 max-w-[200px] truncate"
                        >
                          <GitBranch className="w-3 h-3 shrink-0" />
                          <span className="truncate">{hs.githubRepository.replace('https://github.com/', '')}</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap">
                      <div>Start: {hs.startDate}</div>
                      <div className="text-slate-500">Renew: {hs.renewalDate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={hs.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={hs.status}
                        onChange={(e) => handleStatusSelect(hs, e.target.value as HostingStatus)}
                        aria-label={`Change status for ${hs.hostingId}`}
                        className="px-2.5 py-1.5 rounded-lg bg-[#060B18] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {HOSTING_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminCustomersSection() {
  const { allProfiles, allOrders, allHostingServices, allPayments } = useHostNova();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        registeredAt: Date;
        totalOrders: number;
        activeHosting: number;
        totalDemoPayments: number;
      }
    >();

    for (const p of allProfiles) {
      map.set(p.id, {
        id: p.id,
        name: p.fullName,
        email: p.email,
        registeredAt: p.createdAt,
        totalOrders: 0,
        activeHosting: 0,
        totalDemoPayments: 0,
      });
    }

    for (const o of allOrders) {
      const existing = map.get(o.customerId) || {
        id: o.customerId,
        name: o.customerName,
        email: o.customerEmail,
        registeredAt: o.createdAt,
        totalOrders: 0,
        activeHosting: 0,
        totalDemoPayments: 0,
      };
      existing.totalOrders += 1;
      map.set(o.customerId, existing);
    }

    for (const h of allHostingServices) {
      const existing = map.get(h.customerId);
      if (existing && h.status === 'ACTIVE') {
        existing.activeHosting += 1;
      }
    }

    for (const pay of allPayments) {
      const existing = map.get(pay.customerId);
      if (existing && pay.paymentStatus === 'SUCCESS') {
        existing.totalDemoPayments =
          Math.round((existing.totalDemoPayments + pay.amount) * 100) / 100;
      }
    }

    const q = search.trim().toLowerCase();
    return Array.from(map.values())
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      .sort((a, b) => b.totalDemoPayments - a.totalDemoPayments);
  }, [allProfiles, allOrders, allHostingServices, allPayments, search]);

  return (
    <div className="space-y-5">
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400 bg-[#080E1E]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer Name</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Registration Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Orders</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Active Hosting</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Total Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-medium text-white">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{c.email}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {formatDateShort(c.registeredAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                      {c.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                      {c.activeHosting}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                      {formatUSD(c.totalDemoPayments)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPaymentsSection() {
  const { allPayments } = useHostNova();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPayments.filter(
      (p) =>
        !q ||
        p.transactionId.toLowerCase().includes(q) ||
        p.orderNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.paymentMethod.toLowerCase().includes(q)
    );
  }, [allPayments, search]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-blue-950/35 border border-blue-500/30 px-4 py-3 text-xs text-blue-200">
        Card numbers, CVVs, and expiry dates are never stored. Only billing references and USD transaction metadata are retained.
      </div>

      <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction ID, order #, customer, method..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No payment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400 bg-[#080E1E]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3.5 px-4 font-semibold">Order ID</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Payment Method</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Currency</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-300 whitespace-nowrap">
                      {p.transactionId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                      {p.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{p.customerName}</div>
                      <div className="text-[11px] text-slate-500">{p.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 whitespace-nowrap">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                      {formatUSD(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{p.currency}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminInvoicesSection() {
  const { allInvoices, settings, navigate, notify } = useHostNova();
  const [searchInvoice, setSearchInvoice] = useState('');
  const [customerFilter, setCustomerFilter] = useState('ALL');

  const uniqueCustomers = useMemo(
    () => Array.from(new Set(allInvoices.map((i) => i.customerEmail))).filter(Boolean),
    [allInvoices]
  );

  const filtered = useMemo(() => {
    const q = searchInvoice.trim().toLowerCase();
    return allInvoices.filter((inv) => {
      if (customerFilter !== 'ALL' && inv.customerEmail !== customerFilter) return false;
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q)
      );
    });
  }, [allInvoices, searchInvoice, customerFilter]);

  return (
    <div className="space-y-5">
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            placeholder="Search by invoice number or order number..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          aria-label="Filter invoices by customer"
          className="px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Customers</option>
          {uniqueCustomers.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400 bg-[#080E1E]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Invoice Number</th>
                  <th className="py-3.5 px-4 font-semibold">Order Number</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Plan</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amount (USD)</th>
                  <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-300 font-semibold whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {inv.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 whitespace-nowrap">
                      {inv.planNameSnapshot} · {inv.durationMonths}m
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                      {formatUSD(inv.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.paymentStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateShort(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/invoice/${inv.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
