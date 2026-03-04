'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable, { Pagination } from '@/components/tables/DataTable';
import { Button, Input, Select, Modal, Textarea, Badge, Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import type { Ticket, PaginatedResponse } from '@/types';

const taskTypes = ['REQUEST', 'ISSUE', 'FOLLOW-UP', 'TASK'].map(v => ({ value: v, label: v }));
const statusOptions = ['PENDING', 'RESOLVED'].map(v => ({ value: v, label: v }));
const serviceProducts = ['Internet', 'Security', 'Mail', 'CRM', 'ERP', 'VPN', 'Backup', 'Antivirus', 'Cloud', 'Network', 'Hardware', 'Software', 'Other'].map(v => ({ value: v, label: v }));
const priorities = ['Low', 'Medium', 'High', 'Critical'].map(v => ({ value: v, label: v }));
const companyOptions = ['Company A', 'Company B', 'Company C', 'Company D'].map(v => ({ value: v, label: v }));

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ task_type: 'REQUEST', status: 'PENDING' });
  const [editing, setEditing] = useState(false);

  const { data, loading, refetch } = useApi<PaginatedResponse<Ticket>>(`/tickets?page=${page}&search=${search}`);
  const { data: usersList } = useApi<any>('/settings/users');
  const { data: mastersList } = useApi<any>('/settings/masters');
  const { data: assetsList } = useApi<any>('/assets?limit=200');

  // Pull locations from masters
  const locationOptions = (mastersList || [])
    .filter((m: any) => m.type === 'location' && m.is_active)
    .map((m: any) => ({ value: m.name, label: m.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/tickets/${form.id}`, form); }
      else { await api.post('/tickets', form); }
      setShowModal(false); setForm({ task_type: 'REQUEST', status: 'PENDING' }); setEditing(false); refetch();
    } catch (err: any) { alert(err.message); }
  };

  const statusVariant = (s: string) => {
    if (s === 'RESOLVED' || s === 'Resolved') return 'success';
    if (s === 'PENDING' || s === 'Open') return 'warning';
    return 'gray';
  };

  const taskTypeVariant = (t: string) => {
    if (t === 'REQUEST') return 'info';
    if (t === 'ISSUE') return 'danger';
    if (t === 'FOLLOW-UP') return 'warning';
    return 'gray';
  };

  const columns = [
    { key: 'ticket_number', header: 'Ticket #' },
    { key: 'task_type', header: 'Task', render: (r: Ticket) => <Badge variant={taskTypeVariant(r.task_type || 'REQUEST')}>{r.task_type || 'REQUEST'}</Badge> },
    { key: 'requester_name', header: 'Name' },
    { key: 'company', header: 'Company' },
    { key: 'service_product', header: 'Service/Product' },
    { key: 'issue', header: 'Issue' },
    { key: 'status', header: 'Status', render: (r: Ticket) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
    { key: 'location', header: 'Location' },
    { key: 'assigned_to_name', header: 'Task Owner' },
    { key: 'due_date', header: 'Due Date', render: (r: Ticket) => r.due_date ? formatDate(r.due_date) : '—' },
    { key: 'created_at', header: 'Created', render: (r: Ticket) => formatDate(r.created_at) },
    {
      key: 'actions', header: 'Actions', render: (r: Ticket) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); setForm(r); setEditing(true); setShowModal(true); }} className="text-primary-600 hover:underline text-xs">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this ticket?')) { api.delete(`/tickets/${r.id}`).then(() => refetch()); } }} className="text-red-600 hover:underline text-xs">Delete</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="Tickets" subtitle="IT Support Tickets"
        actions={<Button onClick={() => { setForm({ task_type: 'REQUEST', status: 'PENDING' }); setEditing(false); setShowModal(true); }}><Plus size={16} /> New Ticket</Button>} />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={loading} />
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Ticket' : 'New Ticket'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section 1: Task & Requester Details */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b pb-2">Task & Requester Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Task *" options={taskTypes} value={form.task_type || 'REQUEST'} onChange={e => setForm({ ...form, task_type: e.target.value })} required />
              <Select label="Task Owner" options={(usersList?.users || usersList || []).map((u: any) => ({ value: u.id, label: u.full_name }))} value={form.assigned_to || ''} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
              <Input label="Date" type="date" value={form.task_date || ''} onChange={e => setForm({ ...form, task_date: e.target.value })} />
              <Input label="Name" value={form.requester_name || ''} onChange={e => setForm({ ...form, requester_name: e.target.value })} placeholder="Requester name" />
              <Input label="Email" type="email" value={form.requester_email || ''} onChange={e => setForm({ ...form, requester_email: e.target.value })} placeholder="Requester email" />
              <Input label="CC Mail" type="email" value={form.cc_email || ''} onChange={e => setForm({ ...form, cc_email: e.target.value })} placeholder="CC email address" />
              <Select label="Company" options={companyOptions} value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} />
              <Select label="Location" options={locationOptions.length > 0 ? locationOptions : [{ value: 'HQ', label: 'HQ' }, { value: 'Branch', label: 'Branch' }, { value: 'Remote', label: 'Remote' }]} value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </Card>

          {/* Section 2: Service & Issue Details */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b pb-2">Service & Issue Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Service / Product" options={serviceProducts} value={form.service_product || ''} onChange={e => setForm({ ...form, service_product: e.target.value })} />
              <Input label="Issue" value={form.issue || ''} onChange={e => setForm({ ...form, issue: e.target.value })} placeholder="Brief issue description" />
              <Input label="Due Date" type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              <Select label="Priority" options={priorities} value={form.priority || 'Medium'} onChange={e => setForm({ ...form, priority: e.target.value })} />
              <Select label="Linked Asset" options={(assetsList?.data || []).map((a: any) => ({ value: a.id, label: `${a.asset_tag} - ${a.name || a.product_name || a.type}` }))} value={form.asset_id || ''} onChange={e => setForm({ ...form, asset_id: e.target.value })} />
              <Input label="Category" value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Hardware, Software, Network" />
            </div>
            <div className="mt-4">
              <Textarea label="Remark" value={form.remark || ''} onChange={e => setForm({ ...form, remark: e.target.value })} />
              <p className="text-xs text-gray-500 mt-1">Add detailed remarks, comments, or additional information about this request. Include any relevant context or special instructions.</p>
            </div>
          </Card>

          {/* Section 3: Status & Resolution */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b pb-2">Status & Resolution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <div className="flex gap-4 mt-1">
                  {['RESOLVED', 'PENDING'].map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" value={s} checked={form.status === s} onChange={e => setForm({ ...form, status: e.target.value })}
                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{s}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select RESOLVED if the issue is complete, or PENDING if still in progress</p>
              </div>
              <Input label="Title (internal)" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Internal ticket title" />
            </div>
            <div className="mt-4">
              <Textarea label="Update Log" value={form.update_log || ''} onChange={e => setForm({ ...form, update_log: e.target.value })} />
            </div>
            <div className="mt-4">
              <Textarea label="Notes" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </Card>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
