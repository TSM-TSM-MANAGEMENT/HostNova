import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import {
  CheckCircle2,
  Download,
  FileText,
  Home,
  Loader2,
} from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { db } from '../lib/firebase';
import { toDate } from '../lib/database';
import { formatDateShort, formatUSD } from '../lib/pricing';
import { downloadInvoicePdf } from '../lib/pdfInvoice';
import { InvoiceRecord, OrderRecord } from '../types/hostnova';
import { StatusBadge } from '../components/StatusBadge';

export function PaymentSuccessPage({ orderId }: { orderId: string }) {
  const { myOrders, allOrders, myInvoices, allInvoices, settings, navigate, notify } = useHostNova();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    const cachedOrder =
      myOrders.find((o) => o.id === orderId) || allOrders.find((o) => o.id === orderId);

    if (cachedOrder) {
      setOrder(cachedOrder);
      const cachedInvoice =
        myInvoices.find((i) => i.id === cachedOrder.invoiceId) ||
        allInvoices.find((i) => i.id === cachedOrder.invoiceId);
      if (cachedInvoice) setInvoice(cachedInvoice);
      setLoading(false);
      return;
    }

    async function fetchDirect() {
      try {
        const orderSnap = await getDoc(doc(db, 'orders', orderId));
        if (!active) return;
        if (orderSnap.exists()) {
          const raw = orderSnap.data();
          const mappedOrder: OrderRecord = {
            id: orderSnap.id,
            orderNumber: String(raw.orderNumber || ''),
            customerId: String(raw.customerId || ''),
            customerName: String(raw.customerName || ''),
            customerEmail: String(raw.customerEmail || ''),
            planId: String(raw.planId || ''),
            planNameSnapshot: String(raw.planNameSnapshot || ''),
            baseMonthlyPriceSnapshot: Number(raw.baseMonthlyPriceSnapshot || 0),
            storageSnapshot: Number(raw.storageSnapshot || 0),
            websiteLimitSnapshot: Number(raw.websiteLimitSnapshot || 1),
            durationMonths: Number(raw.durationMonths || 1),
            discountPercentage: Number(raw.discountPercentage || 0),
            discountedMonthlyPrice: Number(raw.discountedMonthlyPrice || 0),
            originalTotal: Number(raw.originalTotal || 0),
            discountAmount: Number(raw.discountAmount || 0),
            finalTotal: Number(raw.finalTotal || 0),
            domain: String(raw.domain || ''),
            githubRepository: String(raw.githubRepository || ''),
            paymentMethod: String(raw.paymentMethod || '').replace(/\s*\(Demo\)/gi, '').trim(),
            paymentId: String(raw.paymentId || ''),
            transactionId: String(raw.transactionId || ''),
            invoiceId: String(raw.invoiceId || ''),
            invoiceNumber: String(raw.invoiceNumber || ''),
            hostingDocId: String(raw.hostingDocId || ''),
            hostingId: String(raw.hostingId || ''),
            orderStatus: (raw.orderStatus as OrderRecord['orderStatus']) || 'CONFIRMED',
            paymentStatus: (raw.paymentStatus as OrderRecord['paymentStatus']) || 'SUCCESS',
            hostingStatus: (raw.hostingStatus as OrderRecord['hostingStatus']) || 'ACTIVE',
            isSimulated: raw.isSimulated !== false,
            createdAt: toDate(raw.createdAt),
            updatedAt: toDate(raw.updatedAt),
          };
          setOrder(mappedOrder);

          if (mappedOrder.invoiceId) {
            const invSnap = await getDoc(doc(db, 'invoices', mappedOrder.invoiceId));
            if (active && invSnap.exists()) {
              const iRaw = invSnap.data();
              setInvoice({
                id: invSnap.id,
                invoiceNumber: String(iRaw.invoiceNumber || ''),
                orderId: String(iRaw.orderId || ''),
                orderNumber: String(iRaw.orderNumber || ''),
                customerId: String(iRaw.customerId || ''),
                customerName: String(iRaw.customerName || ''),
                customerEmail: String(iRaw.customerEmail || ''),
                domain: String(iRaw.domain || ''),
                planNameSnapshot: String(iRaw.planNameSnapshot || ''),
                storageSnapshot: Number(iRaw.storageSnapshot || 0),
                websiteLimitSnapshot: Number(iRaw.websiteLimitSnapshot || 1),
                durationMonths: Number(iRaw.durationMonths || 1),
                baseMonthlyPriceSnapshot: Number(iRaw.baseMonthlyPriceSnapshot || 0),
                discountedMonthlyPrice: Number(iRaw.discountedMonthlyPrice || 0),
                originalTotal: Number(iRaw.originalTotal || 0),
                discountPercentage: Number(iRaw.discountPercentage || 0),
                discountAmount: Number(iRaw.discountAmount || 0),
                finalTotal: Number(iRaw.finalTotal || 0),
                paymentMethod: String(iRaw.paymentMethod || '').replace(/\s*\(Demo\)/gi, '').trim(),
                transactionId: String(iRaw.transactionId || ''),
                amount: Number(iRaw.amount || 0),
                currency: 'USD',
                paymentStatus:
                  iRaw.paymentStatus === 'DEMO PAID'
                    ? 'PAID'
                    : (iRaw.paymentStatus as InvoiceRecord['paymentStatus']) || 'PAID',
                invoiceDate: toDate(iRaw.invoiceDate),
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed loading order:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchDirect();
    return () => {
      active = false;
    };
  }, [orderId, myOrders, allOrders, myInvoices, allInvoices]);

  const handleDownloadPdf = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const targetInvoice: InvoiceRecord = invoice || {
        id: order.invoiceId,
        invoiceNumber: order.invoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        domain: order.domain,
        planNameSnapshot: order.planNameSnapshot,
        storageSnapshot: order.storageSnapshot,
        websiteLimitSnapshot: order.websiteLimitSnapshot,
        durationMonths: order.durationMonths,
        baseMonthlyPriceSnapshot: order.baseMonthlyPriceSnapshot,
        discountedMonthlyPrice: order.discountedMonthlyPrice,
        originalTotal: order.originalTotal,
        discountPercentage: order.discountPercentage,
        discountAmount: order.discountAmount,
        finalTotal: order.finalTotal,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        amount: order.finalTotal,
        currency: 'USD',
        paymentStatus: 'PAID',
        invoiceDate: order.createdAt,
      };
      await downloadInvoicePdf(targetInvoice, settings);
      notify('success', `Downloaded ${targetInvoice.invoiceNumber}.pdf`);
    } catch {
      notify('error', 'Failed to generate PDF invoice.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Order Not Found</h1>
        <p className="text-sm text-slate-400 mb-6">
          Sign in with the account that placed this order or return to the homepage.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          Back to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#060B18] py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B1224] border border-slate-800 rounded-2xl overflow-hidden">
          {/* Header Confirmation */}
          <div className="p-8 sm:p-10 text-center border-b border-slate-800 bg-gradient-to-b from-emerald-950/25 to-transparent">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-xs font-semibold tracking-wider text-emerald-400 mb-1.5">
              Order Confirmed
            </p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Payment Successful
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Your HostNova hosting service is now active and your invoice has been issued.
            </p>
          </div>

          {/* Receipt Details */}
          <div className="p-6 sm:p-8 space-y-4 text-sm tabular-nums">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#060B18] border border-slate-800">
                <div className="text-xs text-slate-400">Transaction ID</div>
                <div className="font-mono font-semibold text-white mt-1 break-all">
                  {order.transactionId}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#060B18] border border-slate-800">
                <div className="text-xs text-slate-400">Invoice Number</div>
                <div className="font-mono font-semibold text-blue-400 mt-1">
                  {order.invoiceNumber}
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 border-t border-b border-slate-800/80">
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Order Number</span>
                <span className="font-mono text-white">{order.orderNumber}</span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Customer Name</span>
                <span className="text-white font-medium">{order.customerName}</span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Selected Plan</span>
                <span className="text-white font-medium">
                  {order.planNameSnapshot} ({order.storageSnapshot} GB SSD · {order.websiteLimitSnapshot}{' '}
                  {order.websiteLimitSnapshot === 1 ? 'Website' : 'Websites'})
                </span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Subscription Duration</span>
                <span className="text-white">
                  {order.durationMonths} {order.durationMonths === 1 ? 'Month' : 'Months'}
                  {order.discountPercentage > 0 ? ` (${order.discountPercentage}% discount)` : ''}
                </span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Amount Paid</span>
                <span className="font-mono font-bold text-blue-400 text-base">
                  {formatUSD(order.finalTotal)}
                </span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Payment Method</span>
                <span className="text-white">{order.paymentMethod}</span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Hosting Status</span>
                <StatusBadge status={order.hostingStatus} />
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Domain</span>
                <span className="text-white font-mono">
                  {order.domain ? order.domain : 'No Domain Provided'}
                </span>
              </div>
              {order.githubRepository && (
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-slate-400">GitHub Repository</span>
                  <span className="text-blue-300 font-mono text-xs truncate max-w-xs">
                    {order.githubRepository}
                  </span>
                </div>
              )}
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Order Date</span>
                <span className="text-slate-300">{formatDateShort(order.createdAt)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  {downloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/invoice/${order.invoiceId}`)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Invoice</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800/70 text-slate-200 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>Back to Homepage</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
