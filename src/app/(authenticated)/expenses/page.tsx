'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable, { Pagination } from '@/components/tables/DataTable';
import { Button, Input, Select, Modal, Textarea, Badge, Card } from '@/components/ui';
import { formatCurrency, formatDate, getRenewalBadge, getPaymentBadge } from '@/lib/utils';
import { Plus, Search, RefreshCw, Calendar, TrendingUp, List } from 'lucide-react';
import type { Expense, PaginatedResponse } from '@/types';
import RenewalCalendar from '@/components/charts/RenewalCalendar';

const expenseTypes = ['Software', 'AMC', 'Internet', 'Cloud', 'Hardware', 'Security', 'Domain', 'Misc'].map(v => ({ value: v, label: v }));
const billingTypes = ['Monthly', 'Quarterly', 'Yearly', 'One-Time'].map(v => ({ value: v, label: v }));
const paymentStatuses = ['Paid', 'Pending', 'Overdue'].map(v => ({ value: v, label: v }));
const licenseTypes = ['Per User', 'Per Device', 'Enterprise', 'Subscription', 'Perpetual'].map(v => ({ value: v, label: v }));

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [form, setForm] = useState<any>({});
  const [renewForm, setRenewForm] = useState<any>({});
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const queryStr = `/expenses?page=${page}&search=${search}${filterType ? `&expense_type=${filterType}` : ''}`;
  const { data, loading, refetch } = useApi<PaginatedResponse<Expense>>(queryStr);
  const { data: forecast } = useApi<any>('/expenses/forecast');
  const { data: vendorsList } = useApi<any>('/vendors?limit=200');
  const { data: assetsList } = useApi<any>('/assets?limit=200');
  const { data: usersList } = useApi<any>('/settings/users');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/expenses/${form.id}`, form);
      } else {
        await api.post('/expenses', form);
      }
      setShowModal(false);
      setForm({});
      setEditing(false);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/expenses/${renewForm.id}/renew`, renewForm);
      setShowRenewModal(false);
      setRenewForm({});
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const viewDetail = async (expense: Expense) => {
    try {
      const detail = await api.get(`/expenses/${expense.id}`);
      setSelectedExpense(detail);
      setShowDetail(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'expense_name', header: 'Name' },
    { key: 'expense_type', header: 'Type', render: (r: Expense) => <Badge variant="info">{r.expense_type}</Badge> },
    { key: 'vendor_name', header: 'Vendor' },
    { key: 'amount', header: 'Amount', render: (r: Expense) => formatCurrency(r.amount) },
    { key: 'billing_type', header: 'Billing' },
    { key: 'expiry_date', header: 'Expiry', render: (r: Expense) => r.expiry_date ? formatDate(r.expiry_date) : '-' },
    {
      key: 'renewal_status', header: 'Renewal', render: (r: Expense) => {
        const b = getRenewalBadge(r.renewal_status || null);
        return <span className={`badge ${b.class}`}>{b.label}</span>;
      }
    },
    {
      key: 'payment_status', header: 'Payment', render: (r: Expense) => {
        const b = getPaymentBadge(r.payment_status);
        return <span className={`badge ${b.class}`}>{b.label}</span>;
      }
    },
    {
      key: 'actions', header: 'Actions', render: (r: Expense) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); setForm(r); setEditing(true); setShowModal(true); }} className="text-primary-600 hover:underline text-xs">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); setRenewForm({ id: r.id, new_expiry_date: '', new_amount: r.amount }); setShowRenewModal(true); }} className="text-green-600 hover:underline text-xs">Renew</button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this expense?')) { api.delete(`/expenses/${r.id}`).then(() => refetch()); } }} className="text-red-600 hover:underline text-xs">Delete</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Manage all IT expenses, licenses, and renewals"
        actions={
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button onClick={() => setView('list')} className={`px-3 py-2 text-xs flex items-center gap-1 ${view === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}><List size={14} /> List</button>
              <button onClick={() => setView('calendar')} className={`px-3 py-2 text-xs flex items-center gap-1 ${view === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}><Calendar size={14} /> Calendar</button>
            </div>
            <Button onClick={() => { setForm({}); setEditing(false); setShowModal(true); }}>
              <Plus size={16} /> Add Expense
            </Button>
          </div>
        }
      />

      {/* Forecast Summary Cards */}
      {forecast && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Monthly Recurring</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(forecast.monthlyRecurring)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Quarterly Recurring</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{formatCurrency(forecast.quarterlyRecurring)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Yearly Recurring</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(forecast.yearlyRecurring)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Annual Forecast</p>
            <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(forecast.annualForecast)}</p>
          </Card>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && <RenewalCalendar />}

      {/* List View */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="">All Types</option>
              {expenseTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <DataTable columns={columns} data={data?.data || []} loading={loading} onRowClick={viewDetail} />
          {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
        </>
      )}

      {/* Add/Edit Expense Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Expense / Software' : 'Add Expense / Software'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Software / Expense Identity */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Software / Expense Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Expense / Software Name" value={form.expense_name || ''} onChange={e => setForm({ ...form, expense_name: e.target.value })} required />
              <Select label="Expense Type" options={expenseTypes} value={form.expense_type || ''} onChange={e => setForm({ ...form, expense_type: e.target.value })} required />
              <Input label="Category" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. OS, Antivirus, Office Suite, Design" />
              <Input label="Version / Edition" value={form.version_edition || ''} onChange={e => setForm({ ...form, version_edition: e.target.value })} placeholder="e.g. v2024, Professional" />
              <Input label="Company" value={form.company_name || ''} onChange={e => setForm({ ...form, company_name: e.target.value })} />
              <Input label="Device / Asset Tag" value={form.device_asset_tag || ''} onChange={e => setForm({ ...form, device_asset_tag: e.target.value })} placeholder="Asset tag" />
              <Select label="Assigned To" options={(usersList?.users || usersList || []).map((u: any) => ({ value: u.id, label: u.full_name }))} value={form.assigned_to || ''} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
              <Select label="Vendor" options={(vendorsList?.data || []).map((v: any) => ({ value: v.id, label: v.name }))} value={form.vendor_id || ''} onChange={e => setForm({ ...form, vendor_id: e.target.value })} />
              <Select label="Linked Asset" options={(assetsList?.data || []).map((a: any) => ({ value: a.id, label: `${a.asset_tag} - ${a.name}` }))} value={form.asset_id || ''} onChange={e => setForm({ ...form, asset_id: e.target.value })} />
            </div>
          </Card>

          {/* Section 2: Cost & Billing */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Cost & Billing</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Total Cost (INR)" type="number" step="0.01" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              <Select label="Billing Type" options={billingTypes} value={form.billing_type || ''} onChange={e => setForm({ ...form, billing_type: e.target.value })} required />
              <Input label="Invoice Number" value={form.invoice_number || ''} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
              <Input label="Purchase / Start Date" type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              <Input label="Renewal / Expiry Date" type="date" value={form.expiry_date || ''} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
              <Select label="Payment Status" options={paymentStatuses} value={form.payment_status || ''} onChange={e => setForm({ ...form, payment_status: e.target.value })} />
              <Input label="Payment Due Date" type="date" value={form.payment_due_date || ''} onChange={e => setForm({ ...form, payment_due_date: e.target.value })} />
              <Input label="Renewal Reminder (Days)" type="number" value={form.renewal_reminder_days || 30} onChange={e => setForm({ ...form, renewal_reminder_days: parseInt(e.target.value) })} />
              <div className="flex items-center gap-2 self-end pb-2">
                <input type="checkbox" id="auto_renew" checked={form.auto_renew || false} onChange={e => setForm({ ...form, auto_renew: e.target.checked })} />
                <label htmlFor="auto_renew" className="text-sm text-gray-700 dark:text-gray-300">Auto Renew</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Upload</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={async (ev) => {
                    const file = ev.target.files?.[0]; if (!file) return;
                    const fd = new FormData(); fd.append('file', file);
                    try { const res = await api.post('/upload', fd); setForm({ ...form, invoice_path: res.url || res.path }); } catch (err: any) { alert(err.message); }
                  }} className="text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:text-sm file:cursor-pointer" />
                  {form.invoice_path && <Badge variant="success">Uploaded</Badge>}
                </div>
              </div>
              <Input label="Location Allocation" value={form.location_allocation || ''} onChange={e => setForm({ ...form, location_allocation: e.target.value })} />
              <Input label="Department Allocation" value={form.department_allocation || ''} onChange={e => setForm({ ...form, department_allocation: e.target.value })} />
            </div>
          </Card>

          {/* Section 3: License Fields (always shown, not just for Software type) */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">License Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="License Type" options={licenseTypes} value={form.license_type || ''} onChange={e => setForm({ ...form, license_type: e.target.value })} />
              <Input label="License Key / Activation Code" type="password" value={form.license_key || ''} onChange={e => setForm({ ...form, license_key: e.target.value })} placeholder="Will be encrypted" />
              <Input label="Total Licenses Purchased" type="number" value={form.total_licenses || ''} onChange={e => setForm({ ...form, total_licenses: parseInt(e.target.value) })} />
              <Input label="Licenses in Use" type="number" value={form.licenses_assigned || ''} onChange={e => setForm({ ...form, licenses_assigned: parseInt(e.target.value) })} />
              <Input label="Cost per License (INR)" type="number" step="0.01" value={form.cost_per_license || ''} onChange={e => setForm({ ...form, cost_per_license: e.target.value })} />
              <div className="flex items-center self-end pb-2">
                <span className="text-sm text-gray-500">Available: <strong>{(form.total_licenses || 0) - (form.licenses_assigned || 0)}</strong></span>
              </div>
            </div>
          </Card>

          {/* Section 4: Remarks */}
          <Card className="p-4">
            <Textarea label="Remarks / Notes" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal open={showRenewModal} onClose={() => setShowRenewModal(false)} title="Mark as Renewed" size="sm">
        <form onSubmit={handleRenew} className="space-y-4">
          <Input label="New Expiry Date" type="date" value={renewForm.new_expiry_date || ''} onChange={e => setRenewForm({ ...renewForm, new_expiry_date: e.target.value })} required />
          <Input label="New Amount" type="number" step="0.01" value={renewForm.new_amount || ''} onChange={e => setRenewForm({ ...renewForm, new_amount: e.target.value })} />
          <Textarea label="Notes" value={renewForm.notes || ''} onChange={e => setRenewForm({ ...renewForm, notes: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowRenewModal(false)}>Cancel</Button>
            <Button type="submit"><RefreshCw size={14} /> Renew</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Expense Details" size="xl">
        {selectedExpense && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> <strong>{selectedExpense.expense_name}</strong></div>
              <div><span className="text-gray-500">Type:</span> <Badge variant="info">{selectedExpense.expense_type}</Badge></div>
              <div><span className="text-gray-500">Amount:</span> <strong>{formatCurrency(selectedExpense.amount)}</strong></div>
              <div><span className="text-gray-500">Billing:</span> {selectedExpense.billing_type}</div>
              <div><span className="text-gray-500">Vendor:</span> {selectedExpense.vendor_name || '-'}</div>
              <div><span className="text-gray-500">Expiry:</span> {selectedExpense.expiry_date ? formatDate(selectedExpense.expiry_date) : '-'}</div>
              <div><span className="text-gray-500">Payment:</span> <span className={`badge ${getPaymentBadge(selectedExpense.payment_status).class}`}>{selectedExpense.payment_status}</span></div>
              <div><span className="text-gray-500">Renewal:</span> <span className={`badge ${getRenewalBadge(selectedExpense.renewal_status || null).class}`}>{selectedExpense.renewal_status || '-'}</span></div>
              <div><span className="text-gray-500">Auto Renew:</span> {selectedExpense.auto_renew ? 'Yes' : 'No'}</div>
              {selectedExpense.total_licenses && (
                <>
                  <div><span className="text-gray-500">License Type:</span> {selectedExpense.license_type}</div>
                  <div><span className="text-gray-500">Total Licenses:</span> {selectedExpense.total_licenses}</div>
                  <div><span className="text-gray-500">Available:</span> {selectedExpense.available_licenses}</div>
                </>
              )}
            </div>
            {selectedExpense.notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                <span className="text-gray-500">Notes:</span> {selectedExpense.notes}
              </div>
            )}
            {/* Renewal History */}
            {selectedExpense.renewal_history && selectedExpense.renewal_history.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Renewal History</h4>
                <div className="space-y-2">
                  {selectedExpense.renewal_history.map(rh => (
                    <div key={rh.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs flex justify-between">
                      <div>
                        <span className="text-gray-500">Previous:</span> {formatDate(rh.previous_expiry_date)} &rarr; <span className="text-gray-500">New:</span> {formatDate(rh.new_expiry_date)}
                      </div>
                      <div>
                        <span className="text-gray-500">{formatCurrency(rh.previous_amount)}</span> &rarr; <strong>{formatCurrency(rh.new_amount)}</strong>
                      </div>
                      <div className="text-gray-400">By {rh.renewed_by_name} on {formatDate(rh.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
