import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, generateTokens } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken: token } = await request.json();
    if (!token) return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });

    const decoded: any = verifyToken(token);
    if (decoded.type !== 'refresh') {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND u.is_active = true`,
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const user = result.rows[0];
    const { token: newToken } = generateTokens(user);
    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}
