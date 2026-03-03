import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { format: string; type: string } }
) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { format, type } = params;

  try {
    let data: any[];
    let title: string;

    switch (type) {
      case 'monthly-budget':
        title = 'Monthly IT Budget Report';
        data = (await pool.query(`SELECT expense_type, billing_type, amount FROM expenses WHERE is_active = true AND deleted_at IS NULL`)).rows;
        break;
      case 'vendor-cost':
        title = 'Vendor Cost Analysis';
        data = (await pool.query(`SELECT v.name as vendor, e.expense_name, e.amount, e.billing_type FROM expenses e JOIN vendors v ON e.vendor_id = v.id WHERE e.is_active = true AND e.deleted_at IS NULL`)).rows;
        break;
      case 'renewals':
        title = 'Renewal Timeline';
        data = (await pool.query(`SELECT expense_name, expense_type, amount, expiry_date, payment_status FROM expenses WHERE expiry_date IS NOT NULL AND is_active = true AND deleted_at IS NULL ORDER BY expiry_date`)).rows;
        break;
      case 'overdue':
        title = 'Overdue Payment Report';
        data = (await pool.query(`SELECT e.expense_name, e.amount, e.payment_due_date, v.name as vendor FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id WHERE e.payment_status = 'Overdue' AND e.is_active = true ORDER BY e.payment_due_date`)).rows;
        break;
      case 'annual-forecast':
        title = 'Annual IT Forecast Report';
        data = (await pool.query(`
          SELECT expense_type,
            SUM(CASE WHEN billing_type='Monthly' THEN amount ELSE 0 END) as monthly,
            SUM(CASE WHEN billing_type='Quarterly' THEN amount ELSE 0 END) as quarterly,
            SUM(CASE WHEN billing_type='Yearly' THEN amount ELSE 0 END) as yearly,
            SUM(CASE WHEN billing_type='One-Time' THEN amount ELSE 0 END) as one_time,
            SUM(CASE WHEN billing_type='Monthly' THEN amount*12 WHEN billing_type='Quarterly' THEN amount*4 WHEN billing_type='Yearly' THEN amount ELSE amount END) as annual_total
          FROM expenses WHERE is_active = true AND deleted_at IS NULL GROUP BY expense_type ORDER BY annual_total DESC
        `)).rows;
        break;
      case 'license-utilization':
        title = 'Software License Utilization Report';
        data = (await pool.query(`
          SELECT e.expense_name, e.license_type, e.total_licenses, e.licenses_assigned,
            (COALESCE(e.total_licenses,0) - COALESCE(e.licenses_assigned,0)) as available,
            CASE WHEN e.total_licenses > 0 THEN ROUND((e.licenses_assigned::decimal / e.total_licenses) * 100, 1) ELSE 0 END as utilization_pct,
            v.name as vendor_name
          FROM expenses e LEFT JOIN vendors v ON e.vendor_id = v.id
          WHERE e.expense_type = 'Software' AND e.is_active = true AND e.deleted_at IS NULL
          ORDER BY utilization_pct DESC
        `)).rows;
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'excel') {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');

      if (data.length > 0) {
        sheet.columns = Object.keys(data[0]).map(key => ({ header: key.replace(/_/g, ' ').toUpperCase(), key, width: 20 }));
        data.forEach(row => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=${type}-${Date.now()}.xlsx`,
        },
      });
    }

    if (format === 'pdf') {
      const PDFDocument = (await import('pdfkit')).default;
      const chunks: Buffer[] = [];

      return new Promise<NextResponse>((resolve) => {
        const doc = new PDFDocument({ margin: 50 });
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename=${type}-${Date.now()}.pdf`,
            },
          }));
        });

        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        if (data.length > 0) {
          const cols = Object.keys(data[0]);
          doc.fontSize(10).font('Helvetica-Bold');
          let y = doc.y;
          cols.forEach((col, i) => {
            doc.text(col.replace(/_/g, ' ').toUpperCase(), 50 + i * 130, y, { width: 125 });
          });
          doc.moveDown();
          doc.font('Helvetica');
          data.forEach(row => {
            y = doc.y;
            if (y > 700) { doc.addPage(); y = 50; }
            cols.forEach((col, i) => {
              doc.text(String(row[col] || ''), 50 + i * 130, y, { width: 125 });
            });
            doc.moveDown(0.5);
          });
        } else {
          doc.text('No data available.');
        }

        doc.end();
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use excel or pdf.' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
