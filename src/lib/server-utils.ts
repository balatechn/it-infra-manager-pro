import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string): string | null {
  if (!text) return null;
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', 'utf8').slice(0, 32);
  const iv = Buffer.from(process.env.ENCRYPTION_IV || 'abcdef0123456789', 'utf8').slice(0, 16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(encryptedText: string): string | null {
  if (!encryptedText) return null;
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', 'utf8').slice(0, 32);
  const iv = Buffer.from(process.env.ENCRYPTION_IV || 'abcdef0123456789', 'utf8').slice(0, 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function getRenewalStatus(expiryDate: string | null | Date): string | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'Expired';
  if (daysLeft <= 7) return 'Critical';
  if (daysLeft <= 30) return 'Expiring Soon';
  return 'Active';
}

export function paginate(page?: string | number | null, limit?: string | number | null) {
  const p = Math.max(1, parseInt(String(page || 1), 10));
  const l = Math.min(100, Math.max(1, parseInt(String(limit || 20), 10)));
  return { page: p, limit: l, offset: (p - 1) * l };
}
