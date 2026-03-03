import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, permissions, is_active } = await request.json();
    const result = await pool.query(
      `UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description),
       permissions = COALESCE($3, permissions), is_active = COALESCE($4, is_active), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, description, permissions ? JSON.stringify(permissions) : null, is_active, params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    await logAudit(user.id, 'UPDATE', 'role', params.id, null, { name, description, permissions });
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Role name already exists' }, { status: 409 });
    console.error('Update role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Check if any users are assigned to this role
    const usersCheck = await pool.query('SELECT COUNT(*) FROM users WHERE role_id = $1 AND deleted_at IS NULL', [params.id]);
    if (parseInt(usersCheck.rows[0].count) > 0) {
      return NextResponse.json({ error: 'Cannot delete role: users are assigned to it' }, { status: 409 });
    }
    await pool.query('DELETE FROM roles WHERE id = $1', [params.id]);
    await logAudit(user.id, 'DELETE', 'role', params.id, null, null);
    return NextResponse.json({ message: 'Role deleted' });
  } catch (error) {
    console.error('Delete role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
