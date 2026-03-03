import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', start_date), 'YYYY-MM') as month,
        SUM(CASE WHEN billing_type = 'Monthly' THEN amount
                 WHEN billing_type = 'Quarterly' THEN amount / 3
                 WHEN billing_type = 'Yearly' THEN amount / 12
                 ELSE amount END) as total
      FROM expenses
      WHERE is_active = true AND deleted_at IS NULL AND start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', start_date) ORDER BY month
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Expense trend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
