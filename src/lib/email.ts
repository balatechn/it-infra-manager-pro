import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || 'IT Infra Manager <noreply@itinfra.com>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured — skipping email send');
    return false;
  }
  try {
    await transporter.sendMail({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.log(`[Email] Sent: ${opts.subject} → ${opts.to}`);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return false;
  }
}

/* ─── Pre-built templates ─────────────────────────── */

export function renewalAlertEmail(items: { name: string; vendor: string; renewal_date: string; cost: number; days_until: number }[]) {
  const rows = items.map(i => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${i.name}</td>
      <td style="padding:8px;border:1px solid #ddd">${i.vendor}</td>
      <td style="padding:8px;border:1px solid #ddd">${i.renewal_date}</td>
      <td style="padding:8px;border:1px solid #ddd">$${i.cost.toLocaleString()}</td>
      <td style="padding:8px;border:1px solid #ddd;color:${i.days_until <= 7 ? '#dc2626' : i.days_until <= 30 ? '#f59e0b' : '#16a34a'}">${i.days_until} days</td>
    </tr>`).join('');

  return {
    subject: `⚠️ IT Infra: ${items.length} Upcoming Renewal${items.length > 1 ? 's' : ''}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#1e40af">IT Infrastructure Renewal Alert</h2>
        <p>The following items are due for renewal:</p>
        <table style="border-collapse:collapse;width:100%">
          <thead><tr style="background:#f3f4f6">
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Item</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Vendor</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Renewal Date</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Cost</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Days Left</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:13px">This is an automated alert from IT Infra Manager Pro.</p>
      </div>`,
    text: `Renewal Alert: ${items.map(i => `${i.name} (${i.vendor}) – ${i.days_until} days left`).join('\n')}`,
  };
}

export function ticketNotificationEmail(ticket: { id: string; title: string; priority: string; assigned_to: string; status: string }) {
  return {
    subject: `🎫 Ticket ${ticket.status === 'open' ? 'Created' : 'Updated'}: ${ticket.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e40af">Ticket ${ticket.status === 'open' ? 'Created' : 'Updated'}</h2>
        <table style="border-collapse:collapse">
          <tr><td style="padding:4px 12px;font-weight:bold">Title:</td><td>${ticket.title}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Priority:</td><td>${ticket.priority}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Status:</td><td>${ticket.status}</td></tr>
          <tr><td style="padding:4px 12px;font-weight:bold">Assigned To:</td><td>${ticket.assigned_to}</td></tr>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:13px">IT Infra Manager Pro</p>
      </div>`,
  };
}
