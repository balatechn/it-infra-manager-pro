import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { paginate } from '@/lib/server-utils';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const { page, limit } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
    const entity_type = url.searchParams.get('entity_type');
    const user_id = url.searchParams.get('user_id');
    const action = url.searchParams.get('action');

    let where = 'WHERE 1=1';
    const params: any[] = [];
    let idx = 1;
    if (entity_type) { where += ` AND al.entity_type = $${idx}`; params.push(entity_type); idx++; }
    if (user_id) { where += ` AND al.user_id = $${idx}`; params.push(user_id); idx++; }
    if (action) { where += ` AND al.action = $${idx}`; params.push(action); idx++; }

    const result = await pool.query(
      `SELECT al.*, u.full_name as user_name, u.email as user_email
       FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ${where}
       ORDER BY al.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, (page - 1) * limit]
    );
    const countRes = await pool.query(`SELECT COUNT(*) FROM audit_logs al ${where}`, params);
    return NextResponse.json({ data: result.rows, total: parseInt(countRes.rows[0].count), page, limit });
  } catch (error) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
