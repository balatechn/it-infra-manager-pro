import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    let where = 'WHERE is_active = true AND deleted_at IS NULL';
    const params: any[] = [];
    if (type) { where += ' AND type = $1'; params.push(type); }
    const result = await pool.query(`SELECT * FROM masters ${where} ORDER BY type, sort_order, name`, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('List masters error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { type, name, description, metadata, sort_order } = await request.json();
    const result = await pool.query(
      'INSERT INTO masters (type, name, description, metadata, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [type, name, description, metadata ? JSON.stringify(metadata) : '{}', sort_order || 0]
    );
    await logAudit(user.id, 'CREATE', 'master', result.rows[0].id, null, result.rows[0]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Master entry already exists' }, { status: 409 });
    console.error('Create master error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
