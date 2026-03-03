import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [monthlyRes, quarterlyRes, yearlyRes, oneTimeRes, upcomingRes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE billing_type = 'Monthly' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE billing_type = 'Quarterly' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE billing_type = 'Yearly' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE billing_type = 'One-Time' AND is_active = true AND deleted_at IS NULL AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)`),
      pool.query(`SELECT expense_name, expense_type, amount, billing_type, expiry_date, vendor_id,
        (SELECT name FROM vendors WHERE id = e.vendor_id) as vendor_name
        FROM expenses e WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 months'
        AND is_active = true AND deleted_at IS NULL ORDER BY expiry_date ASC`),
    ]);

    const m = parseFloat(monthlyRes.rows[0].total);
    const q = parseFloat(quarterlyRes.rows[0].total);
    const y = parseFloat(yearlyRes.rows[0].total);
    const o = parseFloat(oneTimeRes.rows[0].total);

    return NextResponse.json({
      monthlyRecurring: m,
      quarterlyRecurring: q,
      yearlyRecurring: y,
      oneTimeCurrent: o,
      annualForecast: (m * 12) + (q * 4) + y + o,
      upcomingRenewals: upcomingRes.rows,
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
