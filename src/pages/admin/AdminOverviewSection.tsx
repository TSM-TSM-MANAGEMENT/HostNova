import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Clock,
  DollarSign,
  Eye,
  FileText,
  Server,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useHostNova } from '../../context/HostNovaContext';
import { formatDateShort, formatUSD } from '../../lib/pricing';
import { StatusBadge } from '../../components/StatusBadge';
import { AdminSection, OrderRecord } from '../../types/hostnova';

interface AdminOverviewSectionProps {
  onNavigateSection: (section: AdminSection) => void;
  onInspectOrder: (order: OrderRecord) => void;
}

const PIE_COLORS: Record<string, string> = {
  ACTIVE: '#16A34A',
  SUSPENDED: '#D97706',
  CANCELLED: '#DC2626',
  EXPIRED: '#64748B',
};

export function AdminOverviewSection({
  onNavigateSection,
  onInspectOrder,
}: AdminOverviewSectionProps) {
  const { allOrders, allHostingServices, allProfiles, allPayments, navigate } = useHostNova();

  const stats = useMemo(() => {
    const totalOrders = allOrders.length;
    const activeHosting = allHostingServices.filter((h) => h.status === 'ACTIVE').length;
    const pendingOrders = allOrders.filter((o) => o.orderStatus === 'PENDING').length;

    const uniqueCustomerIds = new Set<string>([
      ...allProfiles.map((p) => p.id),
      ...allOrders.map((o) => o.customerId),
    ]);
    const totalCustomers = uniqueCustomerIds.size;

    const totalDemoRevenue = allPayments
      .filter((p) => p.paymentStatus === 'SUCCESS')
      .reduce((acc, p) => acc + p.amount, 0);

    return { totalOrders, activeHosting, pendingOrders, totalCustomers, totalDemoRevenue };
  }, [allOrders, allHostingServices, allProfiles, allPayments]);

  const monthlyRevenueData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; orders: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      map.set(key, { month: label, revenue: 0, orders: 0 });
    }

    for (const order of allOrders) {
      const d = order.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key);
      if (existing) {
        existing.revenue = Math.round((existing.revenue + order.finalTotal) * 100) / 100;
        existing.orders += 1;
      }
    }
    return Array.from(map.values());
  }, [allOrders]);

  const planStatsData = useMemo(() => {
    const counts = new Map<string, { plan: string; orders: number; revenue: number }>();
    for (const order of allOrders) {
      const key = order.planNameSnapshot || 'Other';
      const entry = counts.get(key) || { plan: key, orders: 0, revenue: 0 };
      entry.orders += 1;
      entry.revenue = Math.round((entry.revenue + order.finalTotal) * 100) / 100;
      counts.set(key, entry);
    }
    const list = Array.from(counts.values());
    if (list.length === 0) {
      return [
        { plan: 'Basic', orders: 0, revenue: 0 },
        { plan: 'Pro', orders: 0, revenue: 0 },
        { plan: 'Enterprise', orders: 0, revenue: 0 },
      ];
    }
    return list;
  }, [allOrders]);

  const hostingStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      ACTIVE: 0,
      SUSPENDED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };
    for (const h of allHostingServices) {
      counts[h.status] = (counts[h.status] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [allHostingServices]);

  const recentOrders = allOrders.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Orders',
            value: String(stats.totalOrders),
            sub: 'Confirmed & recorded',
            icon: ShoppingBag,
            color: 'text-blue-400',
          },
          {
            label: 'Active Hosting',
            value: String(stats.activeHosting),
            sub: 'Currently active services',
            icon: Server,
            color: 'text-emerald-400',
          },
          {
            label: 'Pending Orders',
            value: String(stats.pendingOrders),
            sub: 'Awaiting confirmation',
            icon: Clock,
            color: 'text-amber-400',
          },
          {
            label: 'Total Customers',
            value: String(stats.totalCustomers),
            sub: 'Unique customer profiles',
            icon: Users,
            color: 'text-indigo-400',
          },
          {
            label: 'Total Revenue',
            value: formatUSD(stats.totalDemoRevenue),
            sub: 'Confirmed USD payments',
            icon: DollarSign,
            color: 'text-emerald-400',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#0B1224] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color} shrink-0`} aria-hidden="true" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Graphical Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue */}
        <div className="lg:col-span-5 bg-[#0B1224] border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Monthly Revenue (USD)</h2>
            <p className="text-xs text-slate-400">6-month confirmed order volume</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [formatUSD(Number(value || 0)), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Statistics by Plan */}
        <div className="lg:col-span-4 bg-[#0B1224] border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Order Statistics by Plan</h2>
            <p className="text-xs text-slate-400">Orders distributed across hosting tiers</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planStatsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="plan" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="orders" name="Orders" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active vs Suspended Hosting */}
        <div className="lg:col-span-3 bg-[#0B1224] border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-white">Hosting Status Mix</h2>
            <p className="text-xs text-slate-400">Active vs suspended &amp; cancelled</p>
          </div>
          {hostingStatusData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              No hosting services recorded yet.
            </div>
          ) : (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hostingStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={66}
                      paddingAngle={3}
                    >
                      {hostingStatusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[entry.name] || '#3B82F6'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-300 mt-1 tabular-nums">
                {hostingStatusData.map((entry) => (
                  <span key={entry.name} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: PIE_COLORS[entry.name] || '#3B82F6' }}
                    />
                    {entry.name}: {entry.value}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Orders</h2>
            <p className="text-xs text-slate-400">Latest confirmed customer orders</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('orders')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
          >
            View All Orders →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No customer orders have been placed yet. New orders will appear here immediately.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400 bg-[#080E1E]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Hosting Plan</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold">Hosting</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 tabular-nums">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-xs text-blue-300 whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-200 whitespace-nowrap">
                      {order.planNameSnapshot}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {order.durationMonths}m
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                      {formatUSD(order.finalTotal)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.hostingStatus} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {formatDateShort(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          title="Inspect Order"
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
