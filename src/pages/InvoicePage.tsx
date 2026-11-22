import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Download, Loader2, Printer } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { db } from '../lib/firebase';
import { toDate } from '../lib/database';
import { BRAND_LOGO_URL } from '../lib/defaults';
import { formatDateShort, formatUSD } from '../lib/pricing';
import { downloadInvoicePdf } from '../lib/pdfInvoice';
import { InvoiceRecord } from '../types/hostnova';

export function InvoicePage({ invoiceId }: { invoiceId: string }) {
  const { myInvoices, allInvoices, settings, navigate, notify } = useHostNova();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    const cached =
      myInvoices.find((i) => i.id === invoiceId) || allInvoices.find((i) => i.id === invoiceId);
    if (cached) {
      setInvoice(cached);
      setLoading(false);
      return;
    }

    async function fetchInvoice() {
      try {
        const snap = await getDoc(doc(db, 'invoices', invoiceId));
        if (!active) return;
        if (snap.exists()) {
          const raw = snap.data();
          setInvoice({
            id: snap.id,
            invoiceNumber: String(raw.invoiceNumber || ''),
            orderId: String(raw.orderId || ''),
            orderNumber: String(raw.orderNumber || ''),
            customerId: String(raw.customerId || ''),
            customerName: String(raw.customerName || ''),
            customerEmail: String(raw.customerEmail || ''),
            domain: String(raw.domain || ''),
            planNameSnapshot: String(raw.planNameSnapshot || ''),
            storageSnapshot: Number(raw.storageSnapshot || 0),
            websiteLimitSnapshot: Number(raw.websiteLimitSnapshot || 1),
            durationMonths: Number(raw.durationMonths || 1),
            baseMonthlyPriceSnapshot: Number(raw.baseMonthlyPriceSnapshot || 0),
            discountedMonthlyPrice: Number(raw.discountedMonthlyPrice || 0),
            originalTotal: Number(raw.originalTotal || 0),
            discountPercentage: Number(raw.discountPercentage || 0),
            discountAmount: Number(raw.discountAmount || 0),
            finalTotal: Number(raw.finalTotal || 0),
            paymentMethod: String(raw.paymentMethod || '').replace(/\s*\(Demo\)/gi, '').trim(),
            transactionId: String(raw.transactionId || ''),
            amount: Number(raw.amount || 0),
            currency: 'USD',
            paymentStatus:
              raw.paymentStatus === 'DEMO PAID'
                ? 'PAID'
                : (raw.paymentStatus as InvoiceRecord['paymentStatus']) || 'PAID',
            invoiceDate: toDate(raw.invoiceDate),
          });
        }
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchInvoice();
    return () => {
      active = false;
    };
  }, [invoiceId, myInvoices, allInvoices]);

  const handleDownload = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice, settings);
      notify('success', `Downloaded ${invoice.invoiceNumber}.pdf`);
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

  if (!invoice) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Available</h1>
        <p className="text-sm text-slate-400 mb-6">
          This invoice does not exist or requires signing in with the customer or admin account.
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
    <div className="bg-[#060B18] py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Corporate Invoice Sheet */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="h-2.5 bg-[#0B1224]" />

          <div className="p-8 sm:p-12 space-y-8">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-8">
              <div>
                <img
                  src={BRAND_LOGO_URL}
                  alt="HostNova Logo"
                  referrerPolicy="no-referrer"
                  className="h-12 w-auto object-contain mb-3"
                />
                <p className="text-xs text-slate-500">{settings.companyEmail}</p>
                <p className="text-xs text-slate-500">{settings.companyAddress}</p>
              </div>
              <div className="sm:text-right">
                <h1 className="text-3xl font-extrabold tracking-tight text-blue-600">INVOICE</h1>
                <p className="text-sm font-medium text-slate-700 mt-1">{settings.tagline}</p>
                <p className="mt-3 text-xs font-mono font-semibold text-emerald-700">
                  STATUS: {invoice.paymentStatus === 'DEMO PAID' ? 'PAID' : invoice.paymentStatus}
                </p>
              </div>
            </div>

            {/* Customer & Invoice Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-slate-500 mb-2">
                  CUSTOMER INFORMATION
                </h2>
                <p className="font-bold text-slate-900 text-base">{invoice.customerName}</p>
                <p className="text-slate-600">{invoice.customerEmail}</p>
                <p className="text-slate-600 mt-1">
                  Domain:{' '}
                  <span className="font-mono text-slate-800">
                    {invoice.domain ? invoice.domain : 'No Domain Provided'}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5 sm:text-right tabular-nums">
                <h2 className="text-xs font-bold tracking-wider text-slate-500 mb-2">
                  INVOICE DETAILS
                </h2>
                <p className="text-slate-600">
                  Invoice Number:{' '}
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                </p>
                <p className="text-slate-600">
                  Invoice Date:{' '}
                  <span className="font-medium text-slate-900">
                    {formatDateShort(invoice.invoiceDate)}
                  </span>
                </p>
                <p className="text-slate-600">
                  Order Number:{' '}
                  <span className="font-mono font-medium text-slate-900">{invoice.orderNumber}</span>
                </p>
                <p className="text-slate-600">
                  Currency: <span className="font-mono font-medium text-slate-900">USD ($)</span>
                </p>
              </div>
            </div>

            {/* Order Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0B1224] text-white text-xs">
                    <th className="py-3.5 px-4 font-semibold">Hosting Plan &amp; Specs</th>
                    <th className="py-3.5 px-4 font-semibold">Duration</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Base Monthly</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Original Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 tabular-nums">
                  <tr>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">
                        {invoice.planNameSnapshot} Web Hosting Plan
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {invoice.storageSnapshot} GB SSD Storage · {invoice.websiteLimitSnapshot}{' '}
                        {invoice.websiteLimitSnapshot === 1 ? 'Website' : 'Websites'} · Free SSL Certificate
                      </p>
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      {invoice.durationMonths}{' '}
                      {invoice.durationMonths === 1 ? 'Month' : 'Months'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-700">
                      {formatUSD(invoice.baseMonthlyPriceSnapshot)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatUSD(invoice.originalTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs space-y-2">
                <h3 className="font-bold text-slate-500 tracking-wider">
                  PAYMENT INFORMATION
                </h3>
                <p className="text-slate-700">
                  Payment Method: <strong className="text-slate-900">{invoice.paymentMethod}</strong>
                </p>
                <p className="text-slate-700 break-all">
                  Transaction ID:{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {invoice.transactionId}
                  </span>
                </p>
                <p className="text-emerald-700 font-bold">
                  Payment Status: {invoice.paymentStatus === 'DEMO PAID' ? 'PAID' : invoice.paymentStatus}
                </p>
              </div>

              <div className="space-y-2.5 text-sm tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Base Monthly Price</span>
                  <span className="font-mono">{formatUSD(invoice.baseMonthlyPriceSnapshot)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discounted Monthly Price</span>
                  <span className="font-mono">{formatUSD(invoice.discountedMonthlyPrice)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Original Total</span>
                  <span className="font-mono">{formatUSD(invoice.originalTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({invoice.discountPercentage}%)</span>
                  <span className="font-mono">
                    {invoice.discountAmount > 0 ? `-${formatUSD(invoice.discountAmount)}` : '$0.00'}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-300 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-base">Final Total (USD)</span>
                  <span className="font-mono font-extrabold text-2xl text-blue-600">
                    {formatUSD(invoice.finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
              Thank you for choosing HostNova. Retain this invoice for your billing records.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
