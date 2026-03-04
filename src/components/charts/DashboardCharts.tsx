'use client';
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Card } from '@/components/ui';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5', '#c026d3'];

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

function ChartCard({ title, children, height = 300 }: ChartCardProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div style={{ width: '100%', height }}>{children}</div>
    </Card>
  );
}

// ─── Monthly Expense Trend ──────────────────────────────
export function ExpenseTrendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ChartCard title="Monthly IT Expense Trend">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#colorTotal)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Vendor Cost Distribution ───────────────────────────
export function VendorCostChart({ data }: { data: { vendor: string; total: number }[] }) {
  return (
    <ChartCard title="Vendor Cost Distribution">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="vendor" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Renewal Forecast ───────────────────────────────────
export function RenewalForecastChart({ data }: { data: { month: string; count: number; total_cost: number }[] }) {
  return (
    <ChartCard title="Renewal Forecast (Next 3 Months)">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="count" name="Count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="total_cost" name="Cost" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Expense Category Pie ───────────────────────────────
export function ExpenseCategoryPieChart({ data }: { data: { category: string; total: number }[] }) {
  return (
    <ChartCard title="Expense Category Distribution">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="total"
            nameKey="category"
            label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Distribution by Location (Pie) ────────────────────
export function AssetLocationChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartCard title="Distribution by Location">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Distribution by Product (Horizontal Bar) ──────────
export function AssetProductChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ChartCard title="Distribution by Product" height={Math.max(300, data.length * 40)}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
          <Tooltip />
          <Bar dataKey="value" name="Count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Company Names Distribution ─────────────────────────
export function CompanyDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="Company Names">
      <div className="grid grid-cols-2 gap-4 h-full items-center">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.name} className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}>
              {d.value}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{d.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-600 text-white text-xs font-bold">{total}</div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
        </div>
      </div>
    </ChartCard>
  );
}
