import { NextRequest, NextResponse } from 'next/server';
import { authenticate, logAudit } from '@/lib/auth';
import { paginate } from '@/lib/server-utils';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const { page, limit } = paginate(url.searchParams.get('page'), url.searchParams.get('limit'));
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let where = 'WHERE sd.is_active = true AND sd.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (status) { where += ` AND sd.status = $${idx}`; params.push(status); idx++; }
    if (search) { where += ` AND (sd.ip_address ILIKE $${idx} OR sd.hostname ILIKE $${idx} OR sd.sys_name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM snmp_devices sd ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT sd.*, a.name as asset_name, a.asset_tag
       FROM snmp_devices sd LEFT JOIN assets a ON sd.asset_id = a.id
       ${where} ORDER BY sd.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, (page - 1) * limit]
    );

    return NextResponse.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('SNMP list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { asset_id, ip_address, hostname, community_string, snmp_version, port, poll_interval } = await request.json();
    const result = await pool.query(
      `INSERT INTO snmp_devices (asset_id, ip_address, hostname, community_string, snmp_version, port, poll_interval)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [asset_id || null, ip_address, hostname, community_string || 'public', snmp_version || 'v2c', port || 161, poll_interval || 300]
    );
    await logAudit(user.id, 'CREATE', 'snmp_device', result.rows[0].id, null, result.rows[0]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('SNMP create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
