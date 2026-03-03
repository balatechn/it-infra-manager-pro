import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendEmail, renewalAlertEmail } from '@/lib/email';

// This endpoint can be called by Vercel Cron or an external scheduler
// Add to vercel.json: { "crons": [{ "path": "/api/cron/renewal-alerts", "schedule": "0 8 * * *" }] }

export async function GET(req: Request) {
  // Optional: validate cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find expenses with renewals in the next 30 days
    const { rows: upcoming } = await pool.query(`
      SELECT e.id, e.description, e.amount, e.renewal_date,
             v.name as vendor_name,
             EXTRACT(DAY FROM e.renewal_date - CURRENT_DATE)::int as days_until
      FROM expenses e
      LEFT JOIN vendors v ON e.vendor_id = v.id
      WHERE e.renewal_date IS NOT NULL
        AND e.renewal_date >= CURRENT_DATE
        AND e.renewal_date <= CURRENT_DATE + interval '30 days'
        AND e.status = 'active'
      ORDER BY e.renewal_date ASC
    `);

    if (upcoming.length === 0) {
      return NextResponse.json({ message: 'No upcoming renewals', sent: false });
    }

    // Get admin users to notify
    const { rows: admins } = await pool.query(`
      SELECT u.email FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('Super Admin', 'Admin', 'IT Manager')
        AND u.is_active = true
    `);

    if (admins.length === 0) {
      return NextResponse.json({ message: 'No admin users to notify', sent: false });
    }

    const items = upcoming.map((r: any) => ({
      name: r.description,
      vendor: r.vendor_name || 'N/A',
      renewal_date: new Date(r.renewal_date).toLocaleDateString(),
      cost: parseFloat(r.amount),
      days_until: r.days_until,
    }));

    const email = renewalAlertEmail(items);
    const recipients = admins.map((a: any) => a.email);
    const sent = await sendEmail({ to: recipients, ...email });

    // Log the notification
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES ($1, $2, $3, $4)`,
      [null, 'renewal_alert_sent', 'system', JSON.stringify({ recipients, count: items.length, sent })]
    );

    return NextResponse.json({
      message: `Renewal alert processed`,
      upcoming: items.length,
      recipients: recipients.length,
      sent,
    });
  } catch (error: any) {
    console.error('[Cron] Renewal alerts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
