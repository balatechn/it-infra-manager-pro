'use client';
import React from 'react';
import { useApi } from '@/hooks';
import { StatCard, Spinner, Card } from '@/components/ui';
import PageHeader from '@/components/layout/PageHeader';
import { ExpenseTrendChart, VendorCostChart, RenewalForecastChart, ExpenseCategoryPieChart, AssetLocationChart, AssetProductChart, CompanyDistributionChart } from '@/components/charts/DashboardCharts';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';
import {
  Monitor, Network, WifiOff, DollarSign, Calendar, AlertTriangle, AlertCircle, Ticket,
  Package, Key, ClipboardList, Link
} from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, loading } = useApi<DashboardStats>('/dashboard/stats');
  const { data: trend } = useApi<any[]>('/dashboard/expense-trend');
  const { data: vendorDist } = useApi<any[]>('/dashboard/vendor-cost');
  const { data: renewalForecast } = useApi<any[]>('/dashboard/renewal-forecast');
  const { data: categoryPie } = useApi<any[]>('/dashboard/expense-category');
  const { data: assetLocation } = useApi<any[]>('/dashboard/asset-location');
  const { data: assetProduct } = useApi<any[]>('/dashboard/asset-product');
  const { data: companyDist } = useApi<any[]>('/dashboard/company-distribution');

  if (loading || !stats) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="IT Infrastructure Overview" />

      {/* Top Row - Zoho-style Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Requests" value={stats.totalRequests || 0} icon={<ClipboardList size={24} />} color="text-indigo-600" />
        <StatCard title="Total Systems-Inventory" value={stats.totalAssets} icon={<Monitor size={24} />} color="text-blue-600" />
        <StatCard title="Total Software" value={stats.totalSoftware || 0} icon={<Package size={24} />} color="text-green-600" />
        <StatCard title="Total Licenses Purchased" value={stats.totalLicenses || 0} icon={<Key size={24} />} color="text-purple-600" />
      </div>

      {/* Quick Links */}
      <Card className="p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Links</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Systems', href: '/assets', icon: <Monitor size={16} /> },
            { label: 'Software', href: '/expenses', icon: <Package size={16} /> },
            { label: 'Tickets', href: '/tickets', icon: <Ticket size={16} /> },
            { label: 'Vendors', href: '/vendors', icon: <ClipboardList size={16} /> },
            { label: 'Reports', href: '/reports', icon: <Link size={16} /> },
          ].map(l => (
            <a key={l.label} href={l.href} className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 text-sm font-medium transition">
              {l.icon} {l.label}
            </a>
          ))}
        </div>
      </Card>

      {/* Asset-centric Charts (Zoho-style) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {assetLocation && assetLocation.length > 0 && <AssetLocationChart data={assetLocation} />}
        {companyDist && companyDist.length > 0 && <CompanyDistributionChart data={companyDist} />}
        {assetProduct && assetProduct.length > 0 && <AssetProductChart data={assetProduct} />}
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Active SNMP Devices" value={stats.activeSnmpDevices} icon={<Network size={20} />} color="text-green-600" />
        <StatCard title="Down Devices" value={stats.downDevices} icon={<WifiOff size={20} />} color="text-red-600" />
        <StatCard title="Monthly Recurring" value={formatCurrency(stats.monthlyRecurringCost)} icon={<DollarSign size={20} />} color="text-blue-600" />
        <StatCard title="Expiring in 30 Days" value={stats.expiringIn30Days} icon={<Calendar size={20} />} color="text-yellow-600" />
        <StatCard title="Overdue Payments" value={stats.overduePayments} icon={<AlertCircle size={20} />} color="text-red-600" />
      </div>

      {/* Expense Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trend && <ExpenseTrendChart data={trend} />}
        {vendorDist && <VendorCostChart data={vendorDist} />}
        {renewalForecast && <RenewalForecastChart data={renewalForecast} />}
        {categoryPie && <ExpenseCategoryPieChart data={categoryPie} />}
      </div>
    </div>
  );
}
