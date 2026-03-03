import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit, hashPassword } from '@/lib/auth';
import { paginate } from '@/lib/server-utils';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const { page, limit } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));

    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.department, u.location, u.phone, u.is_active, u.last_login, u.created_at, u.role_id, r.name as role_name
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.deleted_at IS NULL ORDER BY u.full_name ASC LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit]
    );
    const countRes = await pool.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
    return NextResponse.json({ data: result.rows, total: parseInt(countRes.rows[0].count), page, limit });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { email, password, full_name, role_id, department, location, phone } = await request.json();
    if (!email || !password || !full_name || !role_id) {
      return NextResponse.json({ error: 'Email, password, full name, and role are required' }, { status: 400 });
    }

    const hash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role_id, department, location, phone) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, email, full_name`,
      [email.toLowerCase(), hash, full_name, role_id, department, location, phone]
    );
    await logAudit(user.id, 'CREATE', 'user', result.rows[0].id, null, { email, full_name });
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
