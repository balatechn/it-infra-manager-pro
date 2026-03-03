import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import { getRenewalStatus } from '@/lib/server-utils';
import pool from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { new_expiry_date, new_amount, notes } = await request.json();
    if (!new_expiry_date) return NextResponse.json({ error: 'New expiry date is required' }, { status: 400 });

    const oldResult = await pool.query('SELECT * FROM expenses WHERE id = $1 AND deleted_at IS NULL', [params.id]);
    if (oldResult.rows.length === 0) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    const old = oldResult.rows[0];

    await pool.query(
      `INSERT INTO expense_renewal_history (expense_id, previous_expiry_date, new_expiry_date, previous_amount, new_amount, renewed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [params.id, old.expiry_date, new_expiry_date, old.amount, new_amount || old.amount, user.id, notes]
    );

    const result = await pool.query(
      `UPDATE expenses SET expiry_date = $1, amount = $2, renewal_status = $3, payment_status = 'Pending', updated_at = NOW() WHERE id = $4 RETURNING *`,
      [new_expiry_date, new_amount || old.amount, getRenewalStatus(new_expiry_date), params.id]
    );

    await logAudit(user.id, 'RENEW', 'expense', params.id, old, result.rows[0]);
    return NextResponse.json({ message: 'Expense renewed successfully', expense: result.rows[0] });
  } catch (error) {
    console.error('Renew error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
