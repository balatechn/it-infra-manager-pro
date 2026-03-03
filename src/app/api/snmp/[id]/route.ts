import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      `SELECT sd.*, a.name as asset_name FROM snmp_devices sd LEFT JOIN assets a ON sd.asset_id = a.id WHERE sd.id = $1`, [params.id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Device not found' }, { status: 404 });

    const logs = await pool.query(
      'SELECT * FROM snmp_logs WHERE device_id = $1 ORDER BY polled_at DESC LIMIT 50', [params.id]
    );
    const device = result.rows[0];
    device.logs = logs.rows;
    return NextResponse.json(device);
  } catch (error) {
    console.error('SNMP get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const fields = ['asset_id', 'ip_address', 'hostname', 'community_string', 'snmp_version', 'port', 'poll_interval', 'is_active'];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = $${idx}`); values.push(body[f]); idx++; }
    }
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    updates.push('updated_at = NOW()');
    values.push(params.id);

    const result = await pool.query(`UPDATE snmp_devices SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('SNMP update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query('UPDATE snmp_devices SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING id', [params.id]);
    if (result.rows.length === 0) return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    await logAudit(user.id, 'DELETE', 'snmp_device', params.id, null, null);
    return NextResponse.json({ message: 'Device deleted' });
  } catch (error) {
    console.error('SNMP delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
