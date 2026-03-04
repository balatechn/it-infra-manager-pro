import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT COALESCE(company_name, 'Unassigned') as name, COUNT(*) as value
      FROM assets WHERE is_active = true AND deleted_at IS NULL
      GROUP BY company_name ORDER BY value DESC LIMIT 10
    `);
    return NextResponse.json(result.rows.map(r => ({ name: r.name, value: parseInt(r.value) })));
  } catch (error) {
    console.error('Company distribution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
