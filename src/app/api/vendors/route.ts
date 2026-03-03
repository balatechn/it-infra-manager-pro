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

    let where = 'WHERE v.is_active = true AND v.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (search) { where += ` AND (v.name ILIKE $${idx} OR v.contact_person ILIKE $${idx} OR v.email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM vendors v ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT v.*,
         (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE vendor_id = v.id AND billing_type = 'Monthly' AND is_active = true AND deleted_at IS NULL) as monthly_cost,
         (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE vendor_id = v.id AND billing_type = 'Yearly' AND is_active = true AND deleted_at IS NULL) as yearly_cost,
         (SELECT COUNT(*) FROM expenses WHERE vendor_id = v.id AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' AND is_active = true AND deleted_at IS NULL) as upcoming_renewals
       FROM vendors v ${where} ORDER BY v.name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, (page - 1) * limit]
    );

    return NextResponse.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Vendors list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, contact_person, email, phone, address, website, gst_number, pan_number, notes } = await request.json();
    const result = await pool.query(
      `INSERT INTO vendors (name, contact_person, email, phone, address, website, gst_number, pan_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, contact_person, email, phone, address, website, gst_number, pan_number, notes]
    );
    await logAudit(user.id, 'CREATE', 'vendor', result.rows[0].id, null, result.rows[0]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Vendor name already exists' }, { status: 409 });
    console.error('Vendor create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
