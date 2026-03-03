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
    const search = url.searchParams.get('search');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const location = url.searchParams.get('location');
    const department = url.searchParams.get('department');

    let where = 'WHERE a.is_active = true AND a.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (search) { where += ` AND (a.name ILIKE $${idx} OR a.asset_tag ILIKE $${idx} OR a.serial_number ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (type) { where += ` AND a.type = $${idx}`; params.push(type); idx++; }
    if (status) { where += ` AND a.status = $${idx}`; params.push(status); idx++; }
    if (location) { where += ` AND a.location = $${idx}`; params.push(location); idx++; }
    if (department) { where += ` AND a.department = $${idx}`; params.push(department); idx++; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM assets a ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT a.*, v.name as vendor_name, u.full_name as assigned_to_name
       FROM assets a LEFT JOIN vendors v ON a.vendor_id = v.id LEFT JOIN users u ON a.assigned_to = u.id
       ${where} ORDER BY a.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, (page - 1) * limit]
    );

    return NextResponse.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Assets list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { asset_tag, name, type, manufacturer, model, serial_number, ip_address, mac_address, location, department, assigned_to, status, purchase_date, warranty_expiry, vendor_id, notes, metadata } = body;

    const result = await pool.query(
      `INSERT INTO assets (asset_tag, name, type, manufacturer, model, serial_number, ip_address, mac_address, location, department, assigned_to, status, purchase_date, warranty_expiry, vendor_id, notes, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [asset_tag, name, type, manufacturer, model, serial_number, ip_address, mac_address, location, department, assigned_to || null, status || 'Active', purchase_date, warranty_expiry, vendor_id || null, notes, metadata ? JSON.stringify(metadata) : '{}']
    );

    await logAudit(user.id, 'CREATE', 'asset', result.rows[0].id, null, result.rows[0]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Asset tag already exists' }, { status: 409 });
    console.error('Asset create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
