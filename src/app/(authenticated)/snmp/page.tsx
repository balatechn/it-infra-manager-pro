'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable, { Pagination } from '@/components/tables/DataTable';
import { Button, Input, Modal, Textarea, Badge } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';
import type { SnmpDevice, PaginatedResponse } from '@/types';

export default function SnmpPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editing, setEditing] = useState(false);
  const [polling, setPolling] = useState<string | null>(null);

  const { data, loading, refetch } = useApi<PaginatedResponse<SnmpDevice>>(`/snmp?page=${page}&search=${search}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/snmp/${form.id}`, form); }
      else { await api.post('/snmp', form); }
      setShowModal(false);
      setForm({});
      setEditing(false);
      refetch();
    } catch (err: any) { alert(err.message); }
  };

  const handlePoll = async (id: string) => {
    setPolling(id);
    try {
      const result = await api.post(`/snmp/${id}/poll`);
      alert(`Poll result: ${result.status}`);
      refetch();
    } catch (err: any) { alert(err.message); }
    finally { setPolling(null); }
  };

  const columns = [
    { key: 'ip_address', header: 'IP Address' },
    { key: 'hostname', header: 'Hostname' },
    { key: 'sys_name', header: 'System Name' },
    { key: 'status', header: 'Status', render: (r: SnmpDevice) => <Badge variant={r.status === 'Up' ? 'success' : r.status === 'Down' ? 'danger' : 'gray'}>{r.status}</Badge> },
    { key: 'last_polled', header: 'Last Polled', render: (r: SnmpDevice) => r.last_polled ? formatDate(r.last_polled) : 'Never' },
    { key: 'uptime', header: 'Uptime' },
    { key: 'sys_location', header: 'Location' },
    {
      key: 'actions', header: 'Actions', render: (r: SnmpDevice) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handlePoll(r.id); }} disabled={polling === r.id} className="text-green-600 hover:underline text-xs disabled:opacity-50">
            {polling === r.id ? 'Polling...' : 'Poll'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setForm(r); setEditing(true); setShowModal(true); }} className="text-primary-600 hover:underline text-xs">Edit</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <PageHeader title="SNMP Devices" subtitle="Monitor network devices via SNMP"
        actions={<Button onClick={() => { setForm({}); setEditing(false); setShowModal(true); }}><Plus size={16} /> Add Device</Button>} />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search devices..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={loading} />
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Device' : 'Add SNMP Device'} size="md">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="IP Address" value={form.ip_address || ''} onChange={e => setForm({ ...form, ip_address: e.target.value })} required />
          <Input label="Hostname" value={form.hostname || ''} onChange={e => setForm({ ...form, hostname: e.target.value })} />
          <Input label="Community String" value={form.community_string || 'public'} onChange={e => setForm({ ...form, community_string: e.target.value })} />
          <Input label="Port" type="number" value={form.port || 161} onChange={e => setForm({ ...form, port: parseInt(e.target.value) })} />
          <Input label="Poll Interval (sec)" type="number" value={form.poll_interval || 300} onChange={e => setForm({ ...form, poll_interval: parseInt(e.target.value) })} />
          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
