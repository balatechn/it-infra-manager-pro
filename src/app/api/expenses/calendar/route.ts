import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getRenewalStatus } from '@/lib/server-utils';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const vendor_id = url.searchParams.get('vendor_id');
    const expense_type = url.searchParams.get('expense_type');
    const location = url.searchParams.get('location');
    const department = url.searchParams.get('department');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    let where = 'WHERE e.is_active = true AND e.deleted_at IS NULL AND e.expiry_date IS NOT NULL';
    const params: any[] = [];
    let idx = 1;

    if (start) { where += ` AND e.expiry_date >= $${idx}`; params.push(start); idx++; }
    if (end) { where += ` AND e.expiry_date <= $${idx}`; params.push(end); idx++; }
    if (vendor_id) { where += ` AND e.vendor_id = $${idx}`; params.push(vendor_id); idx++; }
    if (expense_type) { where += ` AND e.expense_type = $${idx}`; params.push(expense_type); idx++; }
    if (location) { where += ` AND e.location_allocation = $${idx}`; params.push(location); idx++; }
    if (department) { where += ` AND e.department_allocation = $${idx}`; params.push(department); idx++; }

    const result = await pool.query(
      `SELECT e.id, e.expense_name, e.expense_type, e.amount, e.expiry_date, e.billing_type, e.auto_renew, v.name as vendor_name
       FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id ${where} ORDER BY e.expiry_date ASC`, params
    );

    const events = result.rows.map((row: any) => ({ ...row, renewal_status: getRenewalStatus(row.expiry_date) }));
    return NextResponse.json(events);
  } catch (error) {
    console.error('Calendar error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
