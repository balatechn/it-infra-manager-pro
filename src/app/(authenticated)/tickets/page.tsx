'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable, { Pagination } from '@/components/tables/DataTable';
import { Button, Input, Select, Modal, Textarea, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import type { Ticket, PaginatedResponse } from '@/types';

const priorities = ['Low', 'Medium', 'High', 'Critical'].map(v => ({ value: v, label: v }));
const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'].map(v => ({ value: v, label: v }));

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState(false);

  const { data, loading, refetch } = useApi<PaginatedResponse<Ticket>>(`/tickets?page=${page}&search=${search}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/tickets/${form.id}`, form); }
      else { await api.post('/tickets', form); }
      setShowModal(false); setForm({}); setEditing(false); refetch();
    } catch (err: any) { alert(err.message); }
  };

  const priorityVariant = (p: string) => {
    if (p === 'Critical') return 'danger';
    if (p === 'High') return 'warning';
    return 'gray';
  };

  const statusVariant = (s: string) => {
    if (s === 'Open') return 'info';
    if (s === 'In Progress') return 'warning';
    if (s === 'Resolved') return 'success';
    return 'gray';
  };

  const columns = [
    { key: 'ticket_number', header: 'Ticket #' },
    { key: 'title', header: 'Title' },
    { key: 'priority', header: 'Priority', render: (r: Ticket) => <Badge variant={priorityVariant(r.priority)}>{r.priority}</Badge> },
    { key: 'status', header: 'Status', render: (r: Ticket) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
    { key: 'category', header: 'Category' },
    { key: 'assigned_to_name', header: 'Assigned To' },
    { key: 'created_by_name', header: 'Created By' },
    { key: 'created_at', header: 'Created', render: (r: Ticket) => formatDate(r.created_at) },
    {
      key: 'actions', header: 'Actions', render: (r: Ticket) => (
        <button onClick={(e) => { e.stopPropagation(); setForm(r); setEditing(true); setShowModal(true); }} className="text-primary-600 hover:underline text-xs">Edit</button>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Tickets" subtitle="IT Support Tickets"
        actions={<Button onClick={() => { setForm({}); setEditing(false); setShowModal(true); }}><Plus size={16} /> Create Ticket</Button>} />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={loading} />
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Ticket' : 'Create Ticket'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <Input label="Category" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} />
          <Select label="Priority" options={priorities} value={form.priority || ''} onChange={e => setForm({ ...form, priority: e.target.value })} />
          {editing && <Select label="Status" options={statuses} value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })} />}
          <div className="md:col-span-2">
            <Textarea label="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
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
    </div>
  );
}
