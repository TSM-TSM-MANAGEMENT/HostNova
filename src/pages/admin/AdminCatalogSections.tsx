import React, { useEffect, useState } from 'react';
import { Edit3, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useHostNova } from '../../context/HostNovaContext';
import {
  removeHostingPlan,
  saveHostingPlan,
  saveSiteSettings,
  saveSubscriptionDiscount,
} from '../../lib/database';
import { formatUSD } from '../../lib/pricing';
import { HostingPlan, SiteSettings, SubscriptionDiscount } from '../../types/hostnova';

export function AdminPlansSection() {
  const { plans, discounts, notify, requestConfirm } = useHostNova();

  const [editingPlan, setEditingPlan] = useState<HostingPlan | null>(null);
  const [isNewPlan, setIsNewPlan] = useState(false);
  const [featuresText, setFeaturesText] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Discount inline edits
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, number>>({});
  const [savingDiscountId, setSavingDiscountId] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const d of discounts) {
      next[d.id] = d.discountPercentage;
    }
    setDiscountDrafts(next);
  }, [discounts]);

  const openAddPlan = () => {
    setIsNewPlan(true);
    setEditingPlan({
      id: `plan_${Date.now().toString(36)}`,
      name: '',
      tagline: '',
      monthlyPrice: 35,
      storageGb: 75,
      websiteLimit: 5,
      features: ['75 GB SSD Storage', '5 Websites', 'Free SSL Certificate', 'GitHub Integration Support'],
      isPopular: false,
      isActive: true,
      sortOrder: plans.length + 1,
    });
    setFeaturesText('75 GB SSD Storage\n5 Websites\nFree SSL Certificate\nGitHub Integration Support');
  };

  const openEditPlan = (plan: HostingPlan) => {
    setIsNewPlan(false);
    setEditingPlan({ ...plan });
    setFeaturesText(plan.features.join('\n'));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    if (!editingPlan.name.trim()) {
      notify('error', 'Plan name is required.');
      return;
    }
    if (Number(editingPlan.monthlyPrice) <= 0) {
      notify('error', 'Monthly price must be greater than $0.');
      return;
    }

    setSavingPlan(true);
    try {
      const featureLines = featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      await saveHostingPlan(
        {
          ...editingPlan,
          features: featureLines,
        },
        isNewPlan
      );
      notify('success', `Saved hosting plan "${editingPlan.name}".`);
      setEditingPlan(null);
    } catch {
      notify('error', 'Failed to save hosting plan. Please verify values and retry.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = (plan: HostingPlan) => {
    requestConfirm({
      title: `Delete "${plan.name}" plan?`,
      description:
        'Removing this plan removes it from the public storefront. Historical confirmed orders and invoices retain their immutable pricing snapshots.',
      confirmLabel: 'Delete Plan',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await removeHostingPlan(plan.id);
          notify('success', `Deleted plan "${plan.name}".`);
        } catch {
          notify('error', 'Failed to delete plan.');
        }
      },
    });
  };

  const handleToggleActive = async (plan: HostingPlan) => {
    try {
      await saveHostingPlan({ ...plan, isActive: !plan.isActive }, false);
      notify('success', `${plan.name} is now ${!plan.isActive ? 'Active' : 'Disabled'}.`);
    } catch {
      notify('error', 'Failed to toggle plan visibility.');
    }
  };

  const handleSaveDiscount = async (discount: SubscriptionDiscount) => {
    const draftPct = Number(discountDrafts[discount.id] ?? discount.discountPercentage);
    if (Number.isNaN(draftPct) || draftPct < 0 || draftPct > 80) {
      notify('error', 'Discount percentage must be between 0% and 80%.');
      return;
    }
    setSavingDiscountId(discount.id);
    try {
      await saveSubscriptionDiscount({ ...discount, discountPercentage: draftPct });
      notify('success', `Updated ${discount.label} discount to ${draftPct}%.`);
    } catch {
      notify('error', 'Failed to save discount percentage.');
    } finally {
      setSavingDiscountId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-blue-950/35 border border-blue-500/30 px-4 py-3 text-xs text-blue-200">
        Updating plan prices, storage limits, or discounts immediately updates storefront pricing without altering any existing confirmed orders or historical invoices.
      </div>

      {/* Hosting Plans Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Hosting Plans Catalog</h2>
            <p className="text-xs text-slate-400">
              Manage monthly base prices, SSD quotas, website caps, and included features.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddPlan}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#0B1224] border rounded-xl p-6 flex flex-col justify-between ${
                plan.isActive ? 'border-slate-800' : 'border-slate-800/50 opacity-65'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <div className="text-xs text-slate-500 font-mono">ID: {plan.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold font-mono text-blue-400 tabular-nums">
                      {formatUSD(plan.monthlyPrice)}
                    </div>
                    <div className="text-[11px] text-slate-400">/ month</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 mt-3 pb-3 border-b border-slate-800 tabular-nums">
                  <span>{plan.storageGb} GB SSD</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {plan.websiteLimit} {plan.websiteLimit === 1 ? 'Website' : 'Websites'}
                  </span>
                  {plan.isPopular && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-blue-400 font-medium">Most Popular</span>
                    </>
                  )}
                </div>

                <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
                  {plan.features.map((f, idx) => (
                    <li key={idx}>• {f}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggleActive(plan)}
                  className={`text-xs font-semibold ${
                    plan.isActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  {plan.isActive ? 'Enabled' : 'Disabled'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditPlan(plan)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan)}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Discounts Table */}
      <div className="bg-[#0B1224] border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Subscription Duration Discounts</h2>
          <p className="text-xs text-slate-400">
            Configure percentage savings applied dynamically across all hosting plans.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 text-xs text-slate-400 bg-[#080E1E]">
              <tr>
                <th className="py-3 px-5 font-semibold">Duration</th>
                <th className="py-3 px-5 font-semibold">Months</th>
                <th className="py-3 px-5 font-semibold">Discount Percentage (%)</th>
                <th className="py-3 px-5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 tabular-nums">
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 px-5 font-medium text-white">{d.label}</td>
                  <td className="py-3 px-5 font-mono text-slate-400">{d.durationMonths}</td>
                  <td className="py-3 px-5">
                    <div className="inline-flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={80}
                        step={0.5}
                        value={discountDrafts[d.id] ?? d.discountPercentage}
                        onChange={(e) =>
                          setDiscountDrafts((prev) => ({
                            ...prev,
                            [d.id]: Number(e.target.value),
                          }))
                        }
                        aria-label={`Discount percentage for ${d.label}`}
                        className="w-24 px-3 py-1.5 rounded-lg bg-[#060B18] border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button
                      type="button"
                      disabled={savingDiscountId === d.id}
                      onClick={() => void handleSaveDiscount(d)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                    >
                      {savingDiscountId === d.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Plan Modal */}
      {editingPlan && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0D1528] border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {isNewPlan ? 'Add Hosting Plan' : `Edit ${editingPlan.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Base Monthly (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10000}
                    step="0.01"
                    value={editingPlan.monthlyPrice}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, monthlyPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Short Description</label>
                <input
                  type="text"
                  maxLength={160}
                  value={editingPlan.tagline}
                  onChange={(e) => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={editingPlan.storageGb}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, storageGb: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Website Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={editingPlan.websiteLimit}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, websiteLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={editingPlan.sortOrder}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, sortOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Features (one per line, max 15)
                </label>
                <textarea
                  rows={5}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060B18] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isPopular}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                    className="rounded border-slate-600"
                  />
                  <span>Mark as Most Popular</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                    className="rounded border-slate-600"
                  />
                  <span>Active on Storefront</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  {savingPlan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSettingsSection() {
  const { settings, notify } = useHostNova();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSiteSettings(form);
      notify('success', 'Site settings saved to Firestore.');
    } catch {
      notify('error', 'Failed to save site settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl bg-[#0B1224] border border-slate-800 rounded-xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-base font-bold text-white">Company &amp; Invoice Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure brand metadata displayed across the website footer, Contact page, and generated PDF invoices.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Company Name</label>
            <input
              type="text"
              required
              maxLength={80}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#060B18] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Currency</label>
            <input
              type="text"
              readOnly
              value="USD ($)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Tagline</label>
          <input
            type="text"
            required
            maxLength={160}
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#060B18] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Support Email</label>
            <input
              type="email"
              required
              maxLength={200}
              value={form.companyEmail}
              onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#060B18] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Support Phone</label>
            <input
              type="text"
              maxLength={40}
              value={form.companyPhone}
              onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#060B18] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Office Address</label>
          <input
            type="text"
            required
            maxLength={240}
            value={form.companyAddress}
            onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#060B18] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
