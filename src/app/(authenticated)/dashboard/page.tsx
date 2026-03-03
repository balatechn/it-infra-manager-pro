'use client';
import React from 'react';
import { useApi } from '@/hooks';
import { StatCard, Spinner } from '@/components/ui';
import PageHeader from '@/components/layout/PageHeader';
import { ExpenseTrendChart, VendorCostChart, RenewalForecastChart, ExpenseCategoryPieChart } from '@/components/charts/DashboardCharts';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import {
  Monitor, Network, WifiOff, DollarSign, Calendar, AlertTriangle, AlertCircle, Ticket
} from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, loading } = useApi<DashboardStats>('/dashboard/stats');
  const { data: trend } = useApi<any[]>('/dashboard/expense-trend');
  const { data: vendorDist } = useApi<any[]>('/dashboard/vendor-distribution');
  const { data: renewalForecast } = useApi<any[]>('/dashboard/renewal-forecast');
  const { data: categoryPie } = useApi<any[]>('/dashboard/expense-category');

  if (loading || !stats) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="IT Infrastructure Overview" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total IT Assets" value={stats.totalAssets} icon={<Monitor size={24} />} color="text-primary-600" />
        <StatCard title="Active SNMP Devices" value={stats.activeSnmpDevices} icon={<Network size={24} />} color="text-green-600" />
        <StatCard title="Down Devices" value={stats.downDevices} icon={<WifiOff size={24} />} color="text-red-600" />
        <StatCard title="Monthly Recurring Cost" value={formatCurrency(stats.monthlyRecurringCost)} icon={<DollarSign size={24} />} color="text-blue-600" />
        <StatCard title="Yearly Recurring Cost" value={formatCurrency(stats.yearlyRecurringCost)} icon={<DollarSign size={24} />} color="text-purple-600" />
        <StatCard title="Expiring in 30 Days" value={stats.expiringIn30Days} icon={<Calendar size={24} />} color="text-yellow-600" />
        <StatCard title="Expiring in 7 Days" value={stats.expiringIn7Days} icon={<AlertTriangle size={24} />} color="text-orange-600" />
        <StatCard title="Overdue Payments" value={stats.overduePayments} icon={<AlertCircle size={24} />} color="text-red-600" />
        <StatCard title="Open Tickets" value={stats.openTickets} icon={<Ticket size={24} />} color="text-cyan-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trend && <ExpenseTrendChart data={trend} />}
        {vendorDist && <VendorCostChart data={vendorDist} />}
        {renewalForecast && <RenewalForecastChart data={renewalForecast} />}
        {categoryPie && <ExpenseCategoryPieChart data={categoryPie} />}
      </div>
    </div>
  );
}
