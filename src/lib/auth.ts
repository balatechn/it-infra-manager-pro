import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { NextRequest } from 'next/server';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export function generateTokens(user: { id: string; email: string; role_name: string }) {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions
  );
  return { token, refreshToken };
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate a request. Returns the user row (with role info) or null.
 */
export async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    const result = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.is_active = true AND u.deleted_at IS NULL`,
      [decoded.userId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch {
    return null;
  }
}

/**
 * Log an audit entry
 */
export async function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValues: any,
  newValues: any,
  ipAddress?: string
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
