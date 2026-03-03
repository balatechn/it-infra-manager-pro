import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import { paginate, encrypt, decrypt, getRenewalStatus } from '@/lib/server-utils';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const { page, limit } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
    const search = url.searchParams.get('search');
    const expense_type = url.searchParams.get('expense_type');
    const billing_type = url.searchParams.get('billing_type');
    const payment_status = url.searchParams.get('payment_status');
    const vendor_id = url.searchParams.get('vendor_id');
    const renewal_status = url.searchParams.get('renewal_status');

    let where = 'WHERE e.is_active = true AND e.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (search) { where += ` AND (e.expense_name ILIKE $${idx} OR e.category ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (expense_type) { where += ` AND e.expense_type = $${idx}`; params.push(expense_type); idx++; }
    if (billing_type) { where += ` AND e.billing_type = $${idx}`; params.push(billing_type); idx++; }
    if (payment_status) { where += ` AND e.payment_status = $${idx}`; params.push(payment_status); idx++; }
    if (vendor_id) { where += ` AND e.vendor_id = $${idx}`; params.push(vendor_id); idx++; }
    if (renewal_status) { where += ` AND e.renewal_status = $${idx}`; params.push(renewal_status); idx++; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM expenses e ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT e.*, v.name as vendor_name, a.name as asset_name, a.asset_tag
       FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id LEFT JOIN assets a ON e.asset_id = a.id
       ${where} ORDER BY e.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, (page - 1) * limit]
    );

    const isFinance = user.role_name === 'Finance View';
    const data = result.rows.map((row: any) => {
      if (isFinance) {
        delete row.license_key_encrypted;
      } else if (row.license_key_encrypted) {
        row.license_key = decrypt(row.license_key_encrypted);
        delete row.license_key_encrypted;
      }
      row.available_licenses = row.total_licenses ? row.total_licenses - (row.licenses_assigned || 0) : null;
      row.renewal_status = getRenewalStatus(row.expiry_date);
      return row;
    });

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Expenses list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { expense_name, expense_type, vendor_id, asset_id, category, amount, billing_type, start_date, expiry_date, auto_renew, renewal_reminder_days, payment_due_date, payment_status, notes, license_type, total_licenses, licenses_assigned, license_key, location_allocation, department_allocation } = body;

    const encryptedKey = license_key ? encrypt(license_key) : null;
    const renewalStatus = getRenewalStatus(expiry_date);

    const result = await pool.query(
      `INSERT INTO expenses (expense_name, expense_type, vendor_id, asset_id, category, amount, billing_type, start_date, expiry_date, auto_renew, renewal_reminder_days, payment_due_date, payment_status, notes, license_type, total_licenses, licenses_assigned, license_key_encrypted, location_allocation, department_allocation, renewal_status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [expense_name, expense_type, vendor_id || null, asset_id || null, category, amount, billing_type, start_date, expiry_date, auto_renew || false, renewal_reminder_days || 30, payment_due_date, payment_status || 'Pending', notes, license_type, total_licenses, licenses_assigned || 0, encryptedKey, location_allocation, department_allocation, renewalStatus, user.id]
    );

    await logAudit(user.id, 'CREATE', 'expense', result.rows[0].id, null, { ...result.rows[0], license_key_encrypted: '[REDACTED]' });
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Expense create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
