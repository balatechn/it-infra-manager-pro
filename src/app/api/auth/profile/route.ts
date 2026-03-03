import { NextRequest, NextResponse } from 'next/server';
import { authenticate, hashPassword, comparePassword, logAudit } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role_name,
    permissions: user.permissions,
    department: user.department,
    location: user.location,
    phone: user.phone,
  });
}

export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

    const hash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, user.id]);
    await logAudit(user.id, 'CHANGE_PASSWORD', 'user', user.id, null, null);

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
