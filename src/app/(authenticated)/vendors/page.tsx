'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable, { Pagination } from '@/components/tables/DataTable';
import { Button, Input, Modal, Textarea, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import type { Vendor, PaginatedResponse } from '@/types';

export default function VendorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const { data, loading, refetch } = useApi<PaginatedResponse<Vendor>>(`/vendors?page=${page}&search=${search}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/vendors/${form.id}`, form); }
      else { await api.post('/vendors', form); }
      setShowModal(false); setForm({}); setEditing(false); refetch();
    } catch (err: any) { alert(err.message); }
  };

  const viewDetail = async (vendor: Vendor) => {
    try {
      const detail = await api.get(`/vendors/${vendor.id}`);
      setSelectedVendor(detail);
      setShowDetail(true);
    } catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'name', header: 'Vendor Name' },
    { key: 'contact_person', header: 'Contact' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'monthly_cost', header: 'Monthly Cost', render: (r: Vendor) => formatCurrency(r.monthly_cost || 0) },
    { key: 'yearly_cost', header: 'Yearly Cost', render: (r: Vendor) => formatCurrency(r.yearly_cost || 0) },
    { key: 'upcoming_renewals', header: 'Upcoming Renewals' },
    {
      key: 'actions', header: 'Actions', render: (r: Vendor) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); setForm(r); setEditing(true); setShowModal(true); }} className="text-primary-600 hover:underline text-xs">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); api.delete(`/vendors/${r.id}`).then(refetch); }} className="text-red-600 hover:underline text-xs">Delete</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Vendors" subtitle="Manage vendor relationships"
        actions={<Button onClick={() => { setForm({}); setEditing(false); setShowModal(true); }}><Plus size={16} /> Add Vendor</Button>} />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search vendors..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={loading} onRowClick={viewDetail} />
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Vendor Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="Contact Person" value={form.contact_person || ''} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
          <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="Website" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} />
          <Input label="GST Number" value={form.gst_number || ''} onChange={e => setForm({ ...form, gst_number: e.target.value })} />
          <Input label="PAN Number" value={form.pan_number || ''} onChange={e => setForm({ ...form, pan_number: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Textarea label="Notes" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Vendor Details" size="xl">
        {selectedVendor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> <strong>{selectedVendor.name}</strong></div>
              <div><span className="text-gray-500">Contact:</span> {selectedVendor.contact_person || '-'}</div>
              <div><span className="text-gray-500">Email:</span> {selectedVendor.email || '-'}</div>
              <div><span className="text-gray-500">Phone:</span> {selectedVendor.phone || '-'}</div>
              <div><span className="text-gray-500">Website:</span> {selectedVendor.website || '-'}</div>
              <div><span className="text-gray-500">GST:</span> {selectedVendor.gst_number || '-'}</div>
            </div>
            {selectedVendor.cost_summary && (
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-500">Monthly</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(parseFloat(String(selectedVendor.cost_summary.monthly_total)))}</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-500">Quarterly</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(parseFloat(String(selectedVendor.cost_summary.quarterly_total)))}</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-500">Yearly</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(parseFloat(String(selectedVendor.cost_summary.yearly_total)))}</p>
                </Card>
              </div>
            )}
            {selectedVendor.expenses && selectedVendor.expenses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Related Expenses ({selectedVendor.expenses.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedVendor.expenses.map((exp: any) => (
                    <div key={exp.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between text-xs">
                      <span>{exp.expense_name}</span>
                      <span>{exp.expense_type}</span>
                      <span className="font-semibold">{formatCurrency(exp.amount)}</span>
                      <span>{exp.billing_type}</span>
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
