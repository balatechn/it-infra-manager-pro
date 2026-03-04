'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable, { Pagination } from '@/components/tables/DataTable';
import { Button, Input, Select, Modal, Textarea, Badge, Card } from '@/components/ui';
import { formatDate, formatCurrency, safeArray } from '@/lib/utils';
import { Plus, Search, Upload } from 'lucide-react';
import type { Asset, PaginatedResponse } from '@/types';

const assetTypes = ['Server', 'Laptop', 'Desktop', 'Macbook', 'Macbook Pro', 'Network', 'Printer', 'Storage', 'Mobile', 'UPS', 'Other'].map(v => ({ value: v, label: v }));
const statusOptions = ['Active', 'Inactive', 'Under Repair', 'Disposed'].map(v => ({ value: v, label: v }));
const makeOptions = ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Samsung', 'Microsoft', 'Other'].map(v => ({ value: v, label: v }));
const departmentOptions = ['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations', 'Admin', 'Design', 'Engineering'].map(v => ({ value: v, label: v }));

export default function AssetsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState(false);

  const { data, loading, refetch } = useApi<PaginatedResponse<Asset>>(`/assets?page=${page}&search=${search}`);
  const { data: vendorsList } = useApi<any>('/vendors?limit=200');
  const { data: usersList } = useApi<any>('/settings/users');

  const users = safeArray(usersList);
  const vendors = safeArray(vendorsList);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/assets/${form.id}`, form); }
      else { await api.post('/assets', form); }
      setShowModal(false); setForm({}); setEditing(false); refetch();
    } catch (err: any) { alert(err.message); }
  };

  const handleEdit = (asset: Asset) => { setForm(asset); setEditing(true); setShowModal(true); };
  const handleDelete = async (id: string) => { if (!confirm('Delete this asset?')) return; await api.delete(`/assets/${id}`); refetch(); };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { const res = await api.post('/upload', fd); setForm({ ...form, invoice_path: res.url }); } catch (err: any) { alert(err.message); }
  };

  const columns = [
    { key: 'asset_tag', header: 'System Tag' },
    { key: 'product_name', header: 'Product', render: (r: any) => r.product_name || r.name },
    { key: 'type', header: 'Type' },
    { key: 'company_name', header: 'Company' },
    { key: 'status', header: 'Status', render: (r: Asset) => <Badge variant={r.status === 'Active' ? 'success' : r.status === 'Inactive' ? 'gray' : 'warning'}>{r.status}</Badge> },
    { key: 'location', header: 'Location' },
    { key: 'department', header: 'Department' },
    { key: 'assigned_to_name', header: 'Assigned To' },
    { key: 'serial_number', header: 'Serial No' },
    { key: 'vendor_name', header: 'Vendor' },
    { key: 'cost', header: 'Cost', render: (r: any) => r.cost ? formatCurrency(r.cost) : '—' },
    {
      key: 'actions', header: 'Actions', render: (r: Asset) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(r); }} className="text-primary-600 hover:underline text-xs">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="text-red-600 hover:underline text-xs">Delete</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Systems / IT Assets" subtitle="Manage all IT systems & asset inventory"
        actions={<Button onClick={() => { setForm({}); setEditing(false); setShowModal(true); }}><Plus size={16} /> Add System</Button>} />

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by tag, name, serial..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={loading} />
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      {/* Systems Entry Form Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit System' : 'Add System Entry'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: User / Assignment Info */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">User & Assignment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="User ID" value={form.user_id_tag || ''} onChange={e => setForm({ ...form, user_id_tag: e.target.value })} placeholder="User identifier" />
              <Select label="Assigned To (Name)" options={users.map((u: any) => ({ value: u.id, label: u.full_name }))} value={form.assigned_to || ''} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
              <Input label="Phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
              <Input label="Email ID" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input label="Company Name" value={form.company_name || ''} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="e.g. Rainland Auto Corps" />
              <Select label="Department" options={departmentOptions} value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} />
              <Input label="Location" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bangalore" />
              <Input label="Office App ID" value={form.office_app_id || ''} onChange={e => setForm({ ...form, office_app_id: e.target.value })} />
              <Input label="Previous User" value={form.previous_user || ''} onChange={e => setForm({ ...form, previous_user: e.target.value })} />
            </div>
          </Card>

          {/* Section 2: System / Hardware Info */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">System / Hardware Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="System Tag No" value={form.asset_tag || ''} onChange={e => setForm({ ...form, asset_tag: e.target.value })} required />
              <Input label="Product Name" value={form.product_name || ''} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="e.g. Macbook Pro 16" />
              <Select label="Type" options={assetTypes} value={form.type || ''} onChange={e => setForm({ ...form, type: e.target.value })} required />
              <Select label="Make (Manufacturer)" options={makeOptions} value={form.manufacturer || ''} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
              <Input label="Model" value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} />
              <Input label="Serial Number" value={form.serial_number || ''} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
              <Input label="OS & Version" value={form.os_version || ''} onChange={e => setForm({ ...form, os_version: e.target.value })} placeholder="e.g. Windows 11 Pro 23H2" />
              <Input label="IP Address" value={form.ip_address || ''} onChange={e => setForm({ ...form, ip_address: e.target.value })} />
              <Input label="MAC Address" value={form.mac_address || ''} onChange={e => setForm({ ...form, mac_address: e.target.value })} />
              <Select label="Status" options={statusOptions} value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })} />
              <Input label="Warranty Period" value={form.warranty_period || ''} onChange={e => setForm({ ...form, warranty_period: e.target.value })} placeholder="e.g. 3 Years" />
              <Input label="Warranty Expiry" type="date" value={form.warranty_expiry || ''} onChange={e => setForm({ ...form, warranty_expiry: e.target.value })} />
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea label="Configuration / Specs" value={form.config || ''} onChange={e => setForm({ ...form, config: e.target.value })} placeholder="RAM, Storage, Processor etc." />
              <Textarea label="Software Installed" value={form.software || ''} onChange={e => setForm({ ...form, software: e.target.value })} placeholder="List installed software" />
            </div>
          </Card>

          {/* Section 3: Purchase / Vendor Info */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b pb-2">Purchase & Vendor Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select label="Vendor" options={vendors.map((v: any) => ({ value: v.id, label: v.name }))} value={form.vendor_id || ''} onChange={e => setForm({ ...form, vendor_id: e.target.value })} />
              <Input label="Purchase Date" type="date" value={form.purchase_date || ''} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
              <Input label="Cost" type="number" value={form.cost || ''} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="Purchase cost" />
              <Input label="Invoice Number" value={form.invoice_number || ''} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Upload</label>
                <div className="flex items-center gap-2">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleInvoiceUpload} className="text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:text-sm file:cursor-pointer" />
                  {form.invoice_path && <Badge variant="success">Uploaded</Badge>}
                </div>
              </div>
              <Input label="Maintenance Schedule" type="date" value={form.maintenance_schedule || ''} onChange={e => setForm({ ...form, maintenance_schedule: e.target.value })} />
              <Input label="Log Retention" value={form.log_retention || ''} onChange={e => setForm({ ...form, log_retention: e.target.value })} placeholder="e.g. 90 days" />
            </div>
          </Card>

          {/* Section 4: Remarks */}
          <Card className="p-4">
            <Textarea label="Remarks / History Notes" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
