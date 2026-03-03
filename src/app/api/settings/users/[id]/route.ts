import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit, hashPassword } from '@/lib/auth';
import pool from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const fields = ['full_name', 'role_id', 'department', 'location', 'phone', 'is_active'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = $${idx}`); values.push(body[f]); idx++; }
    }
    if (body.password) { updates.push(`password_hash = $${idx}`); values.push(await hashPassword(body.password)); idx++; }
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    updates.push('updated_at = NOW()');
    values.push(params.id);
    const result = await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING id, email, full_name`, values);
    if (result.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await logAudit(user.id, 'UPDATE', 'user', params.id, null, result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query('UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1 AND deleted_at IS NULL RETURNING id', [params.id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    await logAudit(user.id, 'DELETE', 'user', params.id, null, null);
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
