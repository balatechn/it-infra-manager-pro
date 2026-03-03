import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
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

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, permissions } = await request.json();
    if (!name) return NextResponse.json({ error: 'Role name is required' }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *`,
      [name, description || '', JSON.stringify(permissions || {})]
    );
    await logAudit(user.id, 'CREATE', 'role', result.rows[0].id, null, { name, description, permissions });
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
    console.error('Create role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
