import pg from 'pg';
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

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

------------------------------------------------------------
-- ROLES
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- USERS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES roles(id),
  department VARCHAR(100),
  location VARCHAR(100),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

------------------------------------------------------------
-- MASTERS (generic key-value master table)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS masters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(type, name)
);

------------------------------------------------------------
-- VENDORS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

------------------------------------------------------------
-- ASSETS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_tag VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  ip_address VARCHAR(45),
  mac_address VARCHAR(17),
  location VARCHAR(255),
  department VARCHAR(100),
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(30) DEFAULT 'Active',
  purchase_date DATE,
  warranty_expiry DATE,
  vendor_id UUID REFERENCES vendors(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

------------------------------------------------------------
-- SNMP DEVICES
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS snmp_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id),
  ip_address VARCHAR(45) NOT NULL,
  hostname VARCHAR(255),
  community_string VARCHAR(255) DEFAULT 'public',
  snmp_version VARCHAR(5) DEFAULT 'v2c',
  port INT DEFAULT 161,
  status VARCHAR(20) DEFAULT 'Unknown',
  last_polled TIMESTAMPTZ,
  uptime VARCHAR(255),
  sys_descr TEXT,
  sys_name VARCHAR(255),
  sys_location VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  poll_interval INT DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

------------------------------------------------------------
-- SNMP LOGS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS snmp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES snmp_devices(id) ON DELETE CASCADE,
  status VARCHAR(20),
  response_time INT,
  uptime VARCHAR(255),
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  data JSONB DEFAULT '{}',
  polled_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- EXPENSES (CORE TABLE)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_name VARCHAR(255) NOT NULL,
  expense_type VARCHAR(50) NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  asset_id UUID REFERENCES assets(id),
  category VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  billing_type VARCHAR(20) NOT NULL DEFAULT 'Monthly',
  start_date DATE,
  expiry_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  renewal_reminder_days INT DEFAULT 30,
  payment_due_date DATE,
  payment_status VARCHAR(20) DEFAULT 'Pending',
  invoice_path VARCHAR(500),
  notes TEXT,

  -- Software License Extended Fields
  license_type VARCHAR(50),
  total_licenses INT,
  licenses_assigned INT DEFAULT 0,
  license_key_encrypted TEXT,
  location_allocation VARCHAR(255),
  department_allocation VARCHAR(255),

  -- Computed/status fields
  renewal_status VARCHAR(30),

  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

------------------------------------------------------------
-- EXPENSE RENEWAL HISTORY
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_renewal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  previous_expiry_date DATE,
  new_expiry_date DATE,
  previous_amount DECIMAL(12,2),
  new_amount DECIMAL(12,2),
  renewed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- TICKETS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'Medium',
  status VARCHAR(30) DEFAULT 'Open',
  category VARCHAR(100),
  asset_id UUID REFERENCES assets(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

------------------------------------------------------------
-- AUDIT LOGS
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- INDEXES
------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_assets_tag ON assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_snmp_devices_ip ON snmp_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_snmp_devices_status ON snmp_devices(status);
CREATE INDEX IF NOT EXISTS idx_snmp_logs_device ON snmp_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_snmp_logs_polled ON snmp_logs(polled_at);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expiry ON expenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_status ON expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_billing ON expenses(billing_type);
CREATE INDEX IF NOT EXISTS idx_expenses_renewal_status ON expenses(renewal_status);
CREATE INDEX IF NOT EXISTS idx_renewal_history_expense ON expense_renewal_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_masters_type ON masters(type);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
`;

async function migrate() {
  console.log('🔄 Running database migrations...');
  try {
    await pool.query(schema);
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
