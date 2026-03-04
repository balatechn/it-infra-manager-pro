'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useApi, useAuth } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/tables/DataTable';
import { Button, Card, Modal, Input, Select, Badge, Spinner, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Users, Database, Shield, ClipboardList, Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';

type Tab = 'users' | 'roles' | 'masters' | 'audit';

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: 'User Management', icon: <Users size={16} /> },
    { key: 'roles', label: 'Roles', icon: <Shield size={16} /> },
    { key: 'masters', label: 'Master Data', icon: <Database size={16} /> },
    { key: 'audit', label: 'Audit Logs', icon: <ClipboardList size={16} /> },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Application configuration and master data" />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersSection />}
      {tab === 'roles' && <RolesSection />}
      {tab === 'masters' && <MastersSection />}
      {tab === 'audit' && <AuditSection />}
    </div>
  );
}

/* ─── Users Section ────────────────────────────────── */
function UsersSection() {
  const { data, loading, refetch } = useApi<any>('/settings/users');
  const { data: roles } = useApi<any[]>('/settings/roles');
  const rolesArr = Array.isArray(roles) ? roles : [];
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role_id: '', is_active: true });

  const openAdd = () => { setEditing(null); setForm({ full_name: '', email: '', password: '', role_id: '', is_active: true }); setShow(true); };
  const openEdit = (u: any) => { setEditing(u); setForm({ full_name: u.full_name, email: u.email, password: '', role_id: u.role_id, is_active: u.is_active }); setShow(true); };

  const save = async () => {
    try {
      if (editing) {
        const body: any = { full_name: form.full_name, email: form.email, role_id: form.role_id, is_active: form.is_active };
        if (form.password) body.password = form.password;
        await api.put(`/settings/users/${editing.id}`, body);
      } else {
        await api.post('/settings/users', form);
      }
      setShow(false); refetch();
    } catch (e: any) { alert(e.message); }
  };

  const remove = async (id: string) => { if (!confirm('Delete user?')) return; await api.delete(`/settings/users/${id}`); refetch(); };

  const cols = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role_name', header: 'Role', render: (r: any) => <Badge variant="info">{r.role_name}</Badge> },
    { key: 'is_active', header: 'Status', render: (r: any) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'last_login_at', header: 'Last Login', render: (r: any) => r.last_login_at ? formatDate(r.last_login_at) : '—' },
    { key: 'actions', header: '', render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1 text-primary-600 hover:bg-primary-50 rounded"><Pencil size={14} /></button>
        <button onClick={() => remove(r.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Users</h3>
          <Button size="sm" onClick={openAdd}><Plus size={14} /> Add User</Button>
        </div>
        {loading ? <Spinner /> : <DataTable columns={cols} data={(data as any)?.data || []} />}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title={editing ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label={editing ? 'New Password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <Select label="Role" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} options={rolesArr.map((r: any) => ({ value: r.id, label: r.name }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ─── Roles Section ────────────────────────────────── */
function RolesSection() {
  const { data: roles, loading, refetch } = useApi<any[]>('/settings/roles');
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: '' });

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', permissions: '' }); setShow(true); };
  const openEdit = (r: any) => {
    setEditing(r);
    const perms = typeof r.permissions === 'object' ? Object.keys(r.permissions).filter(k => r.permissions[k]).join(', ') : '';
    setForm({ name: r.name, description: r.description || '', permissions: perms });
    setShow(true);
  };

  const save = async () => {
    try {
      const permObj: Record<string, boolean> = {};
      form.permissions.split(',').map(s => s.trim()).filter(Boolean).forEach(p => { permObj[p] = true; });
      const body = { name: form.name, description: form.description, permissions: permObj };
      if (editing) { await api.put(`/settings/roles/${editing.id}`, body); }
      else { await api.post('/settings/roles', body); }
      setShow(false); refetch();
    } catch (e: any) { alert(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try { await api.delete(`/settings/roles/${id}`); refetch(); } catch (e: any) { alert(e.message); }
  };

  const cols = [
    { key: 'name', header: 'Role Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    { key: 'description', header: 'Description' },
    { key: 'permissions', header: 'Permissions', render: (r: any) => {
      const perms = r.permissions ? Object.keys(r.permissions).filter(k => r.permissions[k]) : [];
      return <div className="flex flex-wrap gap-1">{perms.slice(0, 5).map((p: string) => <Badge key={p} variant="gray">{p}</Badge>)}{perms.length > 5 && <Badge variant="info">+{perms.length - 5}</Badge>}</div>;
    }},
    { key: 'actions', header: '', render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1 text-primary-600 hover:bg-primary-50 rounded"><Pencil size={14} /></button>
        <button onClick={() => remove(r.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Roles & Permissions</h3>
          <Button size="sm" onClick={openAdd}><Plus size={14} /> Add Role</Button>
        </div>
        {loading ? <Spinner /> : <DataTable columns={cols} data={roles || []} />}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title={editing ? 'Edit Role' : 'Add Role'} size="md">
        <div className="space-y-4">
          <Input label="Role Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. IT Manager" />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Role description" />
          <Input label="Permissions (comma-separated)" value={form.permissions} onChange={e => setForm({ ...form, permissions: e.target.value })} placeholder="e.g. assets, expenses, tickets, reports" />
          <p className="text-xs text-gray-500">Available: all, assets, expenses, expenses_view, tickets, snmp, vendors, vendors_view, reports, settings, view_only</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ─── Masters Section ────────────────────────────────── */
function MastersSection() {
  const masterTypes = [
    { value: 'expense_type', label: 'Expense Types' },
    { value: 'billing_cycle', label: 'Billing Cycles' },
    { value: 'department', label: 'Departments' },
    { value: 'location', label: 'Locations' },
    { value: 'license_type', label: 'License Types' },
    { value: 'renewal_alert_days', label: 'Renewal Alert Days' },
    { value: 'asset_type', label: 'Asset Types' },
    { value: 'ticket_category', label: 'Ticket Categories' },
  ];

  const [masterType, setMasterType] = useState('expense_type');
  const { data, loading, refetch } = useApi<any[]>(`/settings/masters?type=${masterType}`);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ type: '', name: '', description: '', sort_order: 0, is_active: true });

  useEffect(() => { refetch(); }, [masterType]);

  const openAdd = () => { setEditing(null); setForm({ type: masterType, name: '', description: '', sort_order: 0, is_active: true }); setShow(true); };
  const openEdit = (m: any) => { setEditing(m); setForm({ type: m.type, name: m.name, description: m.description || '', sort_order: m.sort_order, is_active: m.is_active }); setShow(true); };

  const save = async () => {
    try {
      if (editing) { await api.put(`/settings/masters/${editing.id}`, form); }
      else { await api.post('/settings/masters', { ...form, type: masterType }); }
      setShow(false); refetch();
    } catch (e: any) { alert(e.message); }
  };

  const remove = async (id: string) => { if (!confirm('Delete?')) return; await api.delete(`/settings/masters/${id}`); refetch(); };

  const cols = [
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description' },
    { key: 'sort_order', header: 'Order' },
    { key: 'is_active', header: 'Active', render: (r: any) => <Badge variant={r.is_active ? 'success' : 'danger'}>{r.is_active ? 'Yes' : 'No'}</Badge> },
    { key: 'actions', header: '', render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1 text-primary-600 hover:bg-primary-50 rounded"><Pencil size={14} /></button>
        <button onClick={() => remove(r.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <Card>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Master Data</h3>
          <div className="flex gap-2 items-center">
            <select value={masterType} onChange={e => setMasterType(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              {masterTypes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <Button size="sm" onClick={openAdd}><Plus size={14} /> Add</Button>
          </div>
        </div>
        {loading ? <Spinner /> : <DataTable columns={cols} data={data || []} emptyMessage="No master records" />}
      </Card>

      <Modal open={show} onClose={() => setShow(false)} title={editing ? 'Edit Master' : 'Add Master'} size="sm">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Software" />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Software Licenses" />
          <Input label="Sort Order" type="number" value={String(form.sort_order)} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ─── Audit Section ────────────────────────────────── */
function AuditSection() {
  const [filters, setFilters] = useState({ entity_type: '', action: '' });
  const qs = Object.entries(filters).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&');
  const { data, loading, refetch } = useApi<any>(`/settings/audit-logs?${qs}`);

  useEffect(() => { refetch(); }, [filters.entity_type, filters.action]);

  const cols = [
    { key: 'created_at', header: 'Time', render: (r: any) => formatDate(r.created_at) },
    { key: 'user_name', header: 'User' },
    { key: 'action', header: 'Action', render: (r: any) => <Badge variant={r.action === 'DELETE' ? 'danger' : r.action === 'CREATE' ? 'success' : 'info'}>{r.action}</Badge> },
    { key: 'entity_type', header: 'Entity' },
    { key: 'entity_id', header: 'Entity ID', render: (r: any) => <span className="font-mono text-xs">{r.entity_id?.substring(0, 8)}...</span> },
    { key: 'details', header: 'Details', render: (r: any) => r.details ? <span className="text-xs text-gray-500">{JSON.stringify(r.details).substring(0, 80)}...</span> : '—' },
  ];

  return (
    <Card>
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Logs</h3>
        <div className="flex gap-2">
          <select value={filters.entity_type} onChange={e => setFilters({ ...filters, entity_type: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
            <option value="">All Entities</option>
            {['expense', 'asset', 'vendor', 'ticket', 'snmp_device', 'user', 'master'].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })}
            className="text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
            <option value="">All Actions</option>
            {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      {loading ? <Spinner /> : <DataTable columns={cols} data={(data as any)?.data || []} emptyMessage="No audit logs" />}
    </Card>
  );
}
