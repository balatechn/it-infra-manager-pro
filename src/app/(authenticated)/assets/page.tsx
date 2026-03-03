'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable, { Pagination } from '@/components/tables/DataTable';
import { Button, Input, Select, Modal, Textarea, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import type { Asset, PaginatedResponse } from '@/types';

const assetTypes = ['Server', 'Laptop', 'Desktop', 'Network', 'Printer', 'Storage', 'UPS', 'Other'].map(v => ({ value: v, label: v }));
const statusOptions = ['Active', 'Inactive', 'Under Repair', 'Disposed'].map(v => ({ value: v, label: v }));

export default function AssetsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState(false);

  const { data, loading, refetch } = useApi<PaginatedResponse<Asset>>(`/assets?page=${page}&search=${search}`);
  const { data: vendorsList } = useApi<any>('/vendors?limit=200');
  const { data: usersList } = useApi<any>('/settings/users');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/assets/${form.id}`, form);
      } else {
        await api.post('/assets', form);
      }
      setShowModal(false);
      setForm({});
      setEditing(false);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (asset: Asset) => {
    setForm(asset);
    setEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await api.delete(`/assets/${id}`);
    refetch();
  };

  const columns = [
    { key: 'asset_tag', header: 'Tag' },
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status', render: (r: Asset) => <Badge variant={r.status === 'Active' ? 'success' : r.status === 'Inactive' ? 'gray' : 'warning'}>{r.status}</Badge> },
    { key: 'location', header: 'Location' },
    { key: 'department', header: 'Department' },
    { key: 'assigned_to_name', header: 'Assigned To' },
    { key: 'vendor_name', header: 'Vendor' },
    { key: 'created_at', header: 'Created', render: (r: Asset) => formatDate(r.created_at) },
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
      <PageHeader
        title="IT Assets"
        subtitle="Manage all IT assets"
        actions={
          <Button onClick={() => { setForm({}); setEditing(false); setShowModal(true); }}>
            <Plus size={16} /> Add Asset
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={loading} />
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Asset' : 'Add Asset'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Asset Tag" value={form.asset_tag || ''} onChange={e => setForm({ ...form, asset_tag: e.target.value })} required />
          <Input label="Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Select label="Type" options={assetTypes} value={form.type || ''} onChange={e => setForm({ ...form, type: e.target.value })} required />
          <Select label="Status" options={statusOptions} value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })} />
          <Input label="Manufacturer" value={form.manufacturer || ''} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
          <Input label="Model" value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} />
          <Input label="Serial Number" value={form.serial_number || ''} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
          <Input label="IP Address" value={form.ip_address || ''} onChange={e => setForm({ ...form, ip_address: e.target.value })} />
          <Input label="MAC Address" value={form.mac_address || ''} onChange={e => setForm({ ...form, mac_address: e.target.value })} />
          <Input label="Location" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
          <Input label="Department" value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} />
          <Input label="Purchase Date" type="date" value={form.purchase_date || ''} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
          <Input label="Warranty Expiry" type="date" value={form.warranty_expiry || ''} onChange={e => setForm({ ...form, warranty_expiry: e.target.value })} />
          <Select label="Vendor" options={(vendorsList?.data || []).map((v: any) => ({ value: v.id, label: v.name }))} value={form.vendor_id || ''} onChange={e => setForm({ ...form, vendor_id: e.target.value })} />
          <Select label="Assigned To" options={(usersList?.users || usersList || []).map((u: any) => ({ value: u.id, label: u.full_name }))} value={form.assigned_to || ''} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
          <div className="md:col-span-2">
            <Textarea label="Notes" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
