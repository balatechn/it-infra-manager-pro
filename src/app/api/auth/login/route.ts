import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateTokens, comparePassword, logAudit } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.is_active = true AND u.deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const { token, refreshToken } = generateTokens(user);
    await logAudit(user.id, 'LOGIN', 'user', user.id, null, { email: user.email });

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role_name,
        permissions: user.permissions,
        department: user.department,
        location: user.location,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
