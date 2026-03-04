import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      `SELECT t.*, a.name as asset_name, u1.full_name as assigned_to_name, u2.full_name as created_by_name
       FROM tickets t LEFT JOIN assets a ON t.asset_id = a.id LEFT JOIN users u1 ON t.assigned_to = u1.id LEFT JOIN users u2 ON t.created_by = u2.id
       WHERE t.id = $1 AND t.deleted_at IS NULL`, [params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Ticket get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const fields = ['title', 'description', 'priority', 'status', 'category', 'asset_id', 'assigned_to', 'notes',
      'task_type', 'task_date', 'requester_name', 'requester_email', 'cc_email', 'company', 'location', 'service_product', 'issue', 'due_date', 'remark', 'update_log'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = $${idx}`); values.push(body[f]); idx++; }
    }
    if (body.status === 'Resolved') updates.push('resolved_at = NOW()');
    if (body.status === 'Closed') updates.push('closed_at = NOW()');

    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    updates.push('updated_at = NOW()');
    values.push(params.id);

    const result = await pool.query(`UPDATE tickets SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`, values);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    await logAudit(user.id, 'UPDATE', 'ticket', params.id, null, result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Ticket update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query('UPDATE tickets SET deleted_at = NOW(), is_active = false WHERE id = $1 AND deleted_at IS NULL RETURNING id', [params.id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    await logAudit(user.id, 'DELETE', 'ticket', params.id, null, null);
    return NextResponse.json({ message: 'Ticket deleted' });
  } catch (error) {
    console.error('Ticket delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
