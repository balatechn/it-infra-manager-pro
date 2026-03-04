import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      `SELECT a.*, v.name as vendor_name, u.full_name as assigned_to_name
       FROM assets a LEFT JOIN vendors v ON a.vendor_id = v.id LEFT JOIN users u ON a.assigned_to = u.id
       WHERE a.id = $1 AND a.deleted_at IS NULL`, [params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Asset get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const fields = ['asset_tag', 'name', 'type', 'manufacturer', 'model', 'serial_number', 'ip_address', 'mac_address', 'location', 'department', 'assigned_to', 'status', 'purchase_date', 'warranty_expiry', 'vendor_id', 'notes', 'metadata', 'company_name', 'product_name', 'os_version', 'config', 'previous_user', 'cost', 'invoice_number', 'invoice_path', 'maintenance_schedule', 'email', 'phone', 'user_id_tag', 'office_app_id', 'software', 'log_retention', 'warranty_period'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${idx}`);
        values.push(field === 'metadata' ? JSON.stringify(body[field]) : body[field]);
        idx++;
      }
    }
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    updates.push('updated_at = NOW()');
    values.push(params.id);
    const result = await pool.query(
      `UPDATE assets SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`, values
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    await logAudit(user.id, 'UPDATE', 'asset', params.id, null, result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Asset update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      'UPDATE assets SET deleted_at = NOW(), is_active = false WHERE id = $1 AND deleted_at IS NULL RETURNING id', [params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    await logAudit(user.id, 'DELETE', 'asset', params.id, null, null);
    return NextResponse.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Asset delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
