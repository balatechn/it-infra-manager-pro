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
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const assigned_to = url.searchParams.get('assigned_to');

    let where = 'WHERE t.is_active = true AND t.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (search) { where += ` AND (t.title ILIKE $${idx} OR t.ticket_number ILIKE $${idx} OR t.requester_name ILIKE $${idx} OR t.issue ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (status) { where += ` AND t.status = $${idx}`; params.push(status); idx++; }
    if (priority) { where += ` AND t.priority = $${idx}`; params.push(priority); idx++; }
    if (assigned_to) { where += ` AND t.assigned_to = $${idx}`; params.push(assigned_to); idx++; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM tickets t ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const result = await pool.query(
      `SELECT t.*, a.name as asset_name, u1.full_name as assigned_to_name, u2.full_name as created_by_name
       FROM tickets t LEFT JOIN assets a ON t.asset_id = a.id LEFT JOIN users u1 ON t.assigned_to = u1.id LEFT JOIN users u2 ON t.created_by = u2.id
       ${where} ORDER BY t.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, (page - 1) * limit]
    );

    return NextResponse.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Tickets list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM tickets');
    const ticketNumber = `TKT-${String(parseInt(countRes.rows[0].count) + 1).padStart(5, '0')}`;

    const body = await request.json();
    const { title, description, priority, category, asset_id, assigned_to, notes,
      task_type, task_date, requester_name, requester_email, cc_email, company,
      location, service_product, issue, due_date, remark, update_log, status } = body;
    const result = await pool.query(
      `INSERT INTO tickets (ticket_number, title, description, priority, status, category, asset_id, assigned_to, created_by, notes,
        task_type, task_date, requester_name, requester_email, cc_email, company, location, service_product, issue, due_date, remark, update_log)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [ticketNumber, title, description, priority || 'Medium', status || 'PENDING', category, asset_id || null, assigned_to || null, user.id, notes,
        task_type || 'REQUEST', task_date || null, requester_name, requester_email, cc_email, company, location, service_product, issue, due_date || null, remark, update_log]
    );

    await logAudit(user.id, 'CREATE', 'ticket', result.rows[0].id, null, result.rows[0]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Ticket create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
