'use client';
import React, { useState } from 'react';
import { useApi } from '@/hooks';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/tables/DataTable';
import { Button, Card, Spinner, Badge } from '@/components/ui';
import { formatCurrency, formatDate, downloadBlob } from '@/lib/utils';
import { FileSpreadsheet, FileText, TrendingUp, Clock, AlertCircle, DollarSign } from 'lucide-react';

type ReportType = 'monthly-budget' | 'annual-forecast' | 'license-utilization' | 'vendor-cost' | 'renewal-timeline' | 'overdue-payments';

export default function ReportsPage() {
  const [active, setActive] = useState<ReportType>('monthly-budget');

  const { data, loading } = useApi<any[]>(`/reports/${active}`);

  const exportFile = async (type: 'excel' | 'pdf') => {
    try {
      const reportMap: Record<string, string> = { 'monthly-budget': 'monthly-budget', 'annual-forecast': 'annual-forecast', 'license-utilization': 'license-utilization', 'vendor-cost': 'vendor-cost', 'renewal-timeline': 'renewals', 'overdue-payments': 'overdue' };
      const reportKey = reportMap[active];
      if (!reportKey) { alert('Export not available for this report'); return; }
      const blob = await api.get(`/reports/export/${type}/${reportKey}`);
      downloadBlob(blob, `${active}-report.${type === 'excel' ? 'xlsx' : 'pdf'}`);
    } catch (err: any) { alert(err.message); }
  };

  const reports: { key: ReportType; label: string; icon: React.ReactNode }[] = [
    { key: 'monthly-budget', label: 'Monthly IT Budget', icon: <DollarSign size={16} /> },
    { key: 'annual-forecast', label: 'Annual IT Forecast', icon: <TrendingUp size={16} /> },
    { key: 'license-utilization', label: 'License Utilization', icon: <FileText size={16} /> },
    { key: 'vendor-cost', label: 'Vendor Cost Analysis', icon: <DollarSign size={16} /> },
    { key: 'renewal-timeline', label: 'Renewal Timeline', icon: <Clock size={16} /> },
    { key: 'overdue-payments', label: 'Overdue Payments', icon: <AlertCircle size={16} /> },
  ];

  const getColumns = (): any[] => {
    switch (active) {
      case 'monthly-budget':
        return [
          { key: 'expense_type', header: 'Type' },
          { key: 'monthly', header: 'Monthly', render: (r: any) => formatCurrency(parseFloat(r.monthly || 0)) },
          { key: 'quarterly_monthly', header: 'Quarterly (Monthly)', render: (r: any) => formatCurrency(parseFloat(r.quarterly_monthly || 0)) },
          { key: 'yearly_monthly', header: 'Yearly (Monthly)', render: (r: any) => formatCurrency(parseFloat(r.yearly_monthly || 0)) },
          { key: 'total_monthly', header: 'Total Monthly', render: (r: any) => <strong>{formatCurrency(r.total_monthly || 0)}</strong> },
        ];
      case 'annual-forecast':
        return [
          { key: 'expense_type', header: 'Type' },
          { key: 'monthly', header: 'Monthly', render: (r: any) => formatCurrency(r.monthly) },
          { key: 'quarterly', header: 'Quarterly', render: (r: any) => formatCurrency(r.quarterly) },
          { key: 'yearly', header: 'Yearly', render: (r: any) => formatCurrency(r.yearly) },
          { key: 'one_time', header: 'One-Time', render: (r: any) => formatCurrency(r.one_time) },
          { key: 'annual_total', header: 'Annual Total', render: (r: any) => <strong className="text-primary-600">{formatCurrency(r.annual_total)}</strong> },
        ];
      case 'license-utilization':
        return [
          { key: 'expense_name', header: 'Software' },
          { key: 'license_type', header: 'License Type' },
          { key: 'total_licenses', header: 'Total' },
          { key: 'licenses_assigned', header: 'Assigned' },
          { key: 'available', header: 'Available' },
          { key: 'utilization_pct', header: 'Utilization', render: (r: any) => {
            const pct = parseFloat(r.utilization_pct);
            return <Badge variant={pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'success'}>{pct}%</Badge>;
          }},
          { key: 'vendor_name', header: 'Vendor' },
        ];
      case 'vendor-cost':
        return [
          { key: 'vendor', header: 'Vendor' },
          { key: 'expense_count', header: 'Expenses' },
          { key: 'monthly_total', header: 'Monthly', render: (r: any) => formatCurrency(parseFloat(r.monthly_total)) },
          { key: 'quarterly_total', header: 'Quarterly', render: (r: any) => formatCurrency(parseFloat(r.quarterly_total)) },
          { key: 'yearly_total', header: 'Yearly', render: (r: any) => formatCurrency(parseFloat(r.yearly_total)) },
          { key: 'annual_total', header: 'Annual Total', render: (r: any) => <strong className="text-primary-600">{formatCurrency(parseFloat(r.annual_total))}</strong> },
        ];
      case 'renewal-timeline':
        return [
          { key: 'expense_name', header: 'Expense' },
          { key: 'expense_type', header: 'Type' },
          { key: 'vendor_name', header: 'Vendor' },
          { key: 'amount', header: 'Amount', render: (r: any) => formatCurrency(r.amount) },
          { key: 'expiry_date', header: 'Expiry', render: (r: any) => formatDate(r.expiry_date) },
          { key: 'status', header: 'Status', render: (r: any) => <Badge variant={r.status === 'Expired' ? 'danger' : r.status === 'Critical' ? 'danger' : r.status === 'Expiring Soon' ? 'warning' : 'success'}>{r.status}</Badge> },
          { key: 'auto_renew', header: 'Auto Renew', render: (r: any) => r.auto_renew ? 'Yes' : 'No' },
        ];
      case 'overdue-payments':
        return [
          { key: 'expense_name', header: 'Expense' },
          { key: 'vendor_name', header: 'Vendor' },
          { key: 'amount', header: 'Amount', render: (r: any) => formatCurrency(r.amount) },
          { key: 'payment_due_date', header: 'Due Date', render: (r: any) => formatDate(r.payment_due_date) },
          { key: 'days_overdue', header: 'Days Overdue', render: (r: any) => <Badge variant="danger">{r.days_overdue} days</Badge> },
        ];
      default: return [];
    }
  };

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Generate and export IT reports"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportFile('excel')}><FileSpreadsheet size={14} /> Excel</Button>
            <Button variant="secondary" size="sm" onClick={() => exportFile('pdf')}><FileText size={14} /> PDF</Button>
          </div>
        }
      />

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {reports.map(r => (
          <button
            key={r.key}
            onClick={() => setActive(r.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              active === r.key
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : <DataTable columns={getColumns()} data={data || []} emptyMessage="No data for this report" />}
    </div>
  );
}
