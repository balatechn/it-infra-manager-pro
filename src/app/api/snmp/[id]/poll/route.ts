import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const deviceRes = await pool.query('SELECT * FROM snmp_devices WHERE id = $1 AND is_active = true', [params.id]);
    if (deviceRes.rows.length === 0) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

    // Note: SNMP polling uses UDP sockets which don't work in serverless environments.
    // In production, use a separate worker/cron service for actual SNMP polling.
    // This endpoint simulates updating the device status for demonstration.
    const device = deviceRes.rows[0];

    // Attempt a simulated poll (mark as polled)
    await pool.query(
      `UPDATE snmp_devices SET last_polled = NOW(), updated_at = NOW() WHERE id = $1`, [device.id]
    );

    await pool.query(
      `INSERT INTO snmp_logs (device_id, status, data) VALUES ($1, $2, $3)`,
      [device.id, device.status || 'Unknown', JSON.stringify({ note: 'Polled via API' })]
    );

    return NextResponse.json({ status: device.status || 'Unknown', message: 'Poll recorded. For actual SNMP polling, use a worker service.' });
  } catch (error) {
    console.error('SNMP poll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
