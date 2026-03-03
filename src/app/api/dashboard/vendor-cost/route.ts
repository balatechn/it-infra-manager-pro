import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT v.name as vendor, SUM(e.amount) as total
      FROM expenses e JOIN vendors v ON e.vendor_id = v.id
      WHERE e.is_active = true AND e.deleted_at IS NULL
      GROUP BY v.name ORDER BY total DESC LIMIT 10
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Vendor cost error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
