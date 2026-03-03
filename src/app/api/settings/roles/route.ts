import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('List roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
