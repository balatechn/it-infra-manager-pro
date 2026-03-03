import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    switch (params.type) {
      case 'monthly-budget': {
        const result = await pool.query(`
          SELECT expense_type,
            SUM(CASE WHEN billing_type='Monthly' THEN amount ELSE 0 END) as monthly,
            SUM(CASE WHEN billing_type='Quarterly' THEN amount/3 ELSE 0 END) as quarterly_monthly,
            SUM(CASE WHEN billing_type='Yearly' THEN amount/12 ELSE 0 END) as yearly_monthly
          FROM expenses WHERE is_active = true AND deleted_at IS NULL GROUP BY expense_type ORDER BY expense_type
        `);
        const data = result.rows.map((r: any) => ({
          ...r, total_monthly: parseFloat(r.monthly) + parseFloat(r.quarterly_monthly) + parseFloat(r.yearly_monthly),
        }));
        return NextResponse.json(data);
      }

      case 'annual-forecast': {
        const result = await pool.query(`
          SELECT expense_type, billing_type, SUM(amount) as total
          FROM expenses WHERE is_active = true AND deleted_at IS NULL GROUP BY expense_type, billing_type ORDER BY expense_type
        `);
        const forecast: Record<string, any> = {};
        result.rows.forEach((r: any) => {
          if (!forecast[r.expense_type]) forecast[r.expense_type] = { monthly: 0, quarterly: 0, yearly: 0, one_time: 0 };
          const amt = parseFloat(r.total);
          switch (r.billing_type) {
            case 'Monthly': forecast[r.expense_type].monthly = amt; break;
            case 'Quarterly': forecast[r.expense_type].quarterly = amt; break;
            case 'Yearly': forecast[r.expense_type].yearly = amt; break;
            case 'One-Time': forecast[r.expense_type].one_time = amt; break;
          }
        });
        const data = Object.entries(forecast).map(([type, costs]: [string, any]) => ({
          expense_type: type, ...costs,
          annual_total: (costs.monthly * 12) + (costs.quarterly * 4) + costs.yearly + costs.one_time,
        }));
        return NextResponse.json(data);
      }

      case 'license-utilization': {
        const result = await pool.query(`
          SELECT expense_name, license_type, total_licenses, licenses_assigned,
            (total_licenses - COALESCE(licenses_assigned, 0)) as available,
            CASE WHEN total_licenses > 0 THEN ROUND((licenses_assigned::numeric / total_licenses) * 100, 1) ELSE 0 END as utilization_pct,
            v.name as vendor_name
          FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id
          WHERE e.expense_type = 'Software' AND e.total_licenses IS NOT NULL AND e.is_active = true AND e.deleted_at IS NULL
          ORDER BY utilization_pct DESC
        `);
        return NextResponse.json(result.rows);
      }

      case 'vendor-cost': {
        const result = await pool.query(`
          SELECT v.name as vendor,
            SUM(CASE WHEN e.billing_type='Monthly' THEN e.amount ELSE 0 END) as monthly_total,
            SUM(CASE WHEN e.billing_type='Yearly' THEN e.amount ELSE 0 END) as yearly_total,
            SUM(CASE WHEN e.billing_type='Quarterly' THEN e.amount ELSE 0 END) as quarterly_total,
            COUNT(e.id) as expense_count,
            SUM(CASE WHEN e.billing_type='Monthly' THEN e.amount*12 WHEN e.billing_type='Quarterly' THEN e.amount*4 WHEN e.billing_type='Yearly' THEN e.amount ELSE e.amount END) as annual_total
          FROM vendors v LEFT JOIN expenses e ON v.id = e.vendor_id AND e.is_active = true AND e.deleted_at IS NULL
          WHERE v.is_active = true AND v.deleted_at IS NULL GROUP BY v.name ORDER BY annual_total DESC
        `);
        return NextResponse.json(result.rows);
      }

      case 'renewal-timeline': {
        const result = await pool.query(`
          SELECT e.expense_name, e.expense_type, e.amount, e.billing_type, e.expiry_date, e.auto_renew, e.payment_status,
            v.name as vendor_name,
            CASE WHEN e.expiry_date < CURRENT_DATE THEN 'Expired' WHEN e.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Critical'
              WHEN e.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon' ELSE 'Active' END as status
          FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id
          WHERE e.expiry_date IS NOT NULL AND e.is_active = true AND e.deleted_at IS NULL ORDER BY e.expiry_date ASC
        `);
        return NextResponse.json(result.rows);
      }

      case 'overdue-payments': {
        const result = await pool.query(`
          SELECT e.expense_name, e.expense_type, e.amount, e.payment_due_date, e.payment_status,
            v.name as vendor_name, (CURRENT_DATE - e.payment_due_date) as days_overdue
          FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id
          WHERE e.payment_status = 'Overdue' AND e.is_active = true AND e.deleted_at IS NULL ORDER BY e.payment_due_date ASC
        `);
        return NextResponse.json(result.rows);
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
