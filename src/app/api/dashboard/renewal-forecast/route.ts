import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', expiry_date), 'YYYY-MM') as month,
        COUNT(*) as count, SUM(amount) as total_cost
      FROM expenses
      WHERE is_active = true AND deleted_at IS NULL
        AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 months'
      GROUP BY DATE_TRUNC('month', expiry_date) ORDER BY month
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Renewal forecast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
