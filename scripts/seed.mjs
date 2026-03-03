import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  console.log('🔄 Seeding database...');
  try {
    await client.query('BEGIN');

    // Seed Roles
    const roles = [
      { name: 'Super Admin', description: 'Full access to all features', permissions: JSON.stringify({ all: true }) },
      { name: 'IT Manager', description: 'Manage IT assets, expenses, and team', permissions: JSON.stringify({ assets: true, expenses: true, tickets: true, snmp: true, vendors: true, reports: true, settings: true }) },
      { name: 'IT Engineer', description: 'View and manage assets and tickets', permissions: JSON.stringify({ assets: true, tickets: true, snmp: true, expenses_view: true }) },
      { name: 'Finance View', description: 'View financial data and reports', permissions: JSON.stringify({ expenses_view: true, reports: true, vendors_view: true }) },
      { name: 'Read Only', description: 'View-only access', permissions: JSON.stringify({ view_only: true }) },
    ];

    for (const role of roles) {
      await client.query(
        `INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [role.name, role.description, role.permissions]
      );
    }
    console.log('  ✅ Roles seeded');

    // Get Super Admin role id
    const roleRes = await client.query(`SELECT id FROM roles WHERE name = 'Super Admin'`);
    const adminRoleId = roleRes.rows[0].id;

    // Seed Default Admin User
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role_id, department, location)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
      ['admin@itinfra.com', passwordHash, 'System Administrator', adminRoleId, 'IT', 'Head Office']
    );
    console.log('  ✅ Admin user seeded (admin@itinfra.com / Admin@123)');

    // Seed Masters
    const masters = [
      { type: 'expense_type', name: 'Software', sort_order: 1 },
      { type: 'expense_type', name: 'AMC', sort_order: 2 },
      { type: 'expense_type', name: 'Internet', sort_order: 3 },
      { type: 'expense_type', name: 'Cloud', sort_order: 4 },
      { type: 'expense_type', name: 'Hardware', sort_order: 5 },
      { type: 'expense_type', name: 'Security', sort_order: 6 },
      { type: 'expense_type', name: 'Domain', sort_order: 7 },
      { type: 'expense_type', name: 'Misc', sort_order: 8 },
      { type: 'billing_cycle', name: 'Monthly', sort_order: 1 },
      { type: 'billing_cycle', name: 'Quarterly', sort_order: 2 },
      { type: 'billing_cycle', name: 'Yearly', sort_order: 3 },
      { type: 'billing_cycle', name: 'One-Time', sort_order: 4 },
      { type: 'department', name: 'IT', sort_order: 1 },
      { type: 'department', name: 'HR', sort_order: 2 },
      { type: 'department', name: 'Finance', sort_order: 3 },
      { type: 'department', name: 'Sales', sort_order: 4 },
      { type: 'department', name: 'Operations', sort_order: 5 },
      { type: 'department', name: 'Management', sort_order: 6 },
      { type: 'location', name: 'Head Office', sort_order: 1 },
      { type: 'location', name: 'Branch Office 1', sort_order: 2 },
      { type: 'location', name: 'Branch Office 2', sort_order: 3 },
      { type: 'location', name: 'Data Center', sort_order: 4 },
      { type: 'license_type', name: 'Per User', sort_order: 1 },
      { type: 'license_type', name: 'Per Device', sort_order: 2 },
      { type: 'license_type', name: 'Enterprise', sort_order: 3 },
      { type: 'license_type', name: 'Subscription', sort_order: 4 },
      { type: 'renewal_alert_days', name: '7', sort_order: 1 },
      { type: 'renewal_alert_days', name: '15', sort_order: 2 },
      { type: 'renewal_alert_days', name: '30', sort_order: 3 },
      { type: 'renewal_alert_days', name: '60', sort_order: 4 },
      { type: 'renewal_alert_days', name: '90', sort_order: 5 },
    ];

    for (const m of masters) {
      await client.query(
        `INSERT INTO masters (type, name, sort_order) VALUES ($1, $2, $3) ON CONFLICT (type, name) DO NOTHING`,
        [m.type, m.name, m.sort_order]
      );
    }
    console.log('  ✅ Masters seeded (31 records)');

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
