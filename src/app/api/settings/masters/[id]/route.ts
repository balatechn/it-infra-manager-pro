import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, metadata, sort_order, is_active } = await request.json();
    const result = await pool.query(
      `UPDATE masters SET name = COALESCE($1,name), description = COALESCE($2,description), metadata = COALESCE($3,metadata), sort_order = COALESCE($4,sort_order), is_active = COALESCE($5,is_active), updated_at = NOW() WHERE id = $6 RETURNING *`,
      [name, description, metadata ? JSON.stringify(metadata) : null, sort_order, is_active, params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Master not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update master error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await pool.query('UPDATE masters SET deleted_at = NOW(), is_active = false WHERE id = $1', [params.id]);
    return NextResponse.json({ message: 'Master deleted' });
  } catch (error) {
    console.error('Delete master error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
