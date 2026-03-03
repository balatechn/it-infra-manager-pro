'use client';
import React, { useState, useMemo } from 'react';
import { useApi } from '@/hooks';
import { Card, Badge, Select, Spinner } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  expense_name: string;
  expense_type: string;
  vendor_name: string;
  amount: number;
  expiry_date: string;
  billing_type: string;
  renewal_status: string;
}

export default function RenewalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterVendor, setFilterVendor] = useState('');
  const [filterType, setFilterType] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const qs = `/expenses/calendar?year=${year}&month=${month + 1}${filterVendor ? `&vendor=${filterVendor}` : ''}${filterType ? `&expense_type=${filterType}` : ''}`;
  const { data, loading } = useApi<CalendarEvent[]>(qs);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    (data || []).forEach(event => {
      const d = new Date(event.expiry_date).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(event);
    });
    return map;
  }, [data]);

  const statusColor = (status: string) => {
    if (status === 'Expired') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    if (status === 'Critical') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    if (status === 'Expiring Soon') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
  };

  const expenseTypes = ['Software', 'AMC', 'Internet', 'Cloud', 'Hardware', 'Security', 'Domain', 'Misc'];

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[180px] text-center">{monthName}</h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
            <option value="">All Types</option>
            {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
            <option value="">All Vendors</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 dark:bg-gray-800/50 min-h-[80px] p-1" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const events = eventsByDay[day] || [];
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <div key={day} className={`bg-white dark:bg-gray-800 min-h-[80px] p-1 ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}>
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary-600 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map(evt => (
                      <div key={evt.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${statusColor(evt.renewal_status)}`} title={`${evt.expense_name} - ${formatCurrency(evt.amount)}`}>
                        {evt.expense_name}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-gray-500 px-1">+{events.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/50" /> Active</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-900/50" /> Expiring Soon</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-900/50" /> Critical</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/50" /> Expired</div>
          </div>
        </>
      )}
    </Card>
  );
}
