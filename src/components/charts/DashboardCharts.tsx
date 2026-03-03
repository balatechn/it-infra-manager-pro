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
