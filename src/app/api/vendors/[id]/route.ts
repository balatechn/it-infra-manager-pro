import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query('SELECT * FROM vendors WHERE id = $1 AND deleted_at IS NULL', [params.id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const vendor = result.rows[0];
    const [expenses, costsRes] = await Promise.all([
      pool.query(`SELECT id, expense_name, expense_type, amount, billing_type, expiry_date, payment_status
        FROM expenses WHERE vendor_id = $1 AND is_active = true AND deleted_at IS NULL ORDER BY created_at DESC`, [params.id]),
      pool.query(`SELECT
        COALESCE(SUM(CASE WHEN billing_type='Monthly' THEN amount END),0) as monthly_total,
        COALESCE(SUM(CASE WHEN billing_type='Yearly' THEN amount END),0) as yearly_total,
        COALESCE(SUM(CASE WHEN billing_type='Quarterly' THEN amount END),0) as quarterly_total
        FROM expenses WHERE vendor_id = $1 AND is_active = true AND deleted_at IS NULL`, [params.id]),
    ]);

    vendor.expenses = expenses.rows;
    vendor.cost_summary = costsRes.rows[0];
    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Vendor get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const fields = ['name', 'contact_person', 'email', 'phone', 'address', 'website', 'gst_number', 'pan_number', 'notes'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = $${idx}`); values.push(body[f]); idx++; }
    }
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    updates.push('updated_at = NOW()');
    values.push(params.id);
    const result = await pool.query(`UPDATE vendors SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`, values);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    await logAudit(user.id, 'UPDATE', 'vendor', params.id, null, result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Vendor update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query('UPDATE vendors SET deleted_at = NOW(), is_active = false WHERE id = $1 AND deleted_at IS NULL RETURNING id', [params.id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    await logAudit(user.id, 'DELETE', 'vendor', params.id, null, null);
    return NextResponse.json({ message: 'Vendor deleted' });
  } catch (error) {
    console.error('Vendor delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
