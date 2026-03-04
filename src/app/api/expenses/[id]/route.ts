import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import { decrypt, getRenewalStatus, encrypt } from '@/lib/server-utils';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      `SELECT e.*, v.name as vendor_name, a.name as asset_name, a.asset_tag
       FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id LEFT JOIN assets a ON e.asset_id = a.id
       WHERE e.id = $1 AND e.deleted_at IS NULL`, [params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    const expense = result.rows[0];
    const isFinance = user.role_name === 'Finance View';
    if (isFinance) { delete expense.license_key_encrypted; }
    else if (expense.license_key_encrypted) {
      expense.license_key = decrypt(expense.license_key_encrypted);
      delete expense.license_key_encrypted;
    }
    expense.available_licenses = expense.total_licenses ? expense.total_licenses - (expense.licenses_assigned || 0) : null;
    expense.renewal_status = getRenewalStatus(expense.expiry_date);

    const historyRes = await pool.query(
      `SELECT rh.*, u.full_name as renewed_by_name FROM expense_renewal_history rh LEFT JOIN users u ON rh.renewed_by = u.id WHERE rh.expense_id = $1 ORDER BY rh.created_at DESC`, [params.id]
    );
    expense.renewal_history = historyRes.rows;
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Expense get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const oldResult = await pool.query('SELECT * FROM expenses WHERE id = $1 AND deleted_at IS NULL', [params.id]);
    if (oldResult.rows.length === 0) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    const fields = ['expense_name', 'expense_type', 'vendor_id', 'asset_id', 'category', 'amount', 'billing_type', 'start_date', 'expiry_date', 'auto_renew', 'renewal_reminder_days', 'payment_due_date', 'payment_status', 'notes', 'license_type', 'total_licenses', 'licenses_assigned', 'location_allocation', 'department_allocation', 'assigned_to', 'company_name', 'version_edition', 'invoice_number', 'cost_per_license', 'software_name', 'device_asset_tag'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of fields) {
      if (body[field] !== undefined) { updates.push(`${field} = $${idx}`); values.push(body[field]); idx++; }
    }
    if (body.license_key !== undefined) { updates.push(`license_key_encrypted = $${idx}`); values.push(encrypt(body.license_key)); idx++; }

    const expiryDate = body.expiry_date || oldResult.rows[0].expiry_date;
    updates.push(`renewal_status = $${idx}`); values.push(getRenewalStatus(expiryDate)); idx++;
    updates.push('updated_at = NOW()');
    values.push(params.id);

    const result = await pool.query(`UPDATE expenses SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    await logAudit(user.id, 'UPDATE', 'expense', params.id, oldResult.rows[0], result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Expense update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      'UPDATE expenses SET deleted_at = NOW(), is_active = false WHERE id = $1 AND deleted_at IS NULL RETURNING id', [params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    await logAudit(user.id, 'DELETE', 'expense', params.id, null, null);
    return NextResponse.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Expense delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
