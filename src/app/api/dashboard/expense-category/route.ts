import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT expense_type as category, SUM(amount) as total
      FROM expenses WHERE is_active = true AND deleted_at IS NULL
      GROUP BY expense_type ORDER BY total DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Expense category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
