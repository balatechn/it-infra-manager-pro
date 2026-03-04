import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [assets, snmpUp, snmpDown, monthly, yearly, exp30, exp7, overdue, tickets, totalSoftware, totalLicenses, totalRequests] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM assets WHERE is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) as count FROM snmp_devices WHERE status = 'Up' AND is_active = true`),
      pool.query(`SELECT COUNT(*) as count FROM snmp_devices WHERE status = 'Down' AND is_active = true`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE billing_type = 'Monthly' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE billing_type = 'Yearly' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) as count FROM expenses WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) as count FROM expenses WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) as count FROM expenses WHERE payment_status = 'Overdue' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) as count FROM tickets WHERE status = 'Open' AND is_active = true`),
      pool.query(`SELECT COUNT(*) as count FROM expenses WHERE expense_type = 'Software' AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COALESCE(SUM(total_licenses), 0) as count FROM expenses WHERE total_licenses IS NOT NULL AND is_active = true AND deleted_at IS NULL`),
      pool.query(`SELECT COUNT(*) as count FROM tickets WHERE is_active = true`),
    ]);

    return NextResponse.json({
      totalAssets: parseInt(assets.rows[0].count),
      activeSnmpDevices: parseInt(snmpUp.rows[0].count),
      downDevices: parseInt(snmpDown.rows[0].count),
      monthlyRecurringCost: parseFloat(monthly.rows[0].total),
      yearlyRecurringCost: parseFloat(yearly.rows[0].total),
      expiringIn30Days: parseInt(exp30.rows[0].count),
      expiringIn7Days: parseInt(exp7.rows[0].count),
      overduePayments: parseInt(overdue.rows[0].count),
      openTickets: parseInt(tickets.rows[0].count),
      totalSoftware: parseInt(totalSoftware.rows[0].count),
      totalLicenses: parseInt(totalLicenses.rows[0].count),
      totalRequests: parseInt(totalRequests.rows[0].count),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
