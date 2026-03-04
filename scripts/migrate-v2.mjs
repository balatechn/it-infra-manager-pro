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

const migrations = `
------------------------------------------------------------
-- ASSETS: Add missing fields from Zoho Systems form
------------------------------------------------------------
ALTER TABLE assets ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS os_version VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS config TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS previous_user VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS cost DECIMAL(12,2);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS invoice_path VARCHAR(500);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS maintenance_schedule DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_id_tag VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS office_app_id VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS software TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS log_retention VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_period VARCHAR(100);

------------------------------------------------------------
-- EXPENSES: Add missing fields from Zoho Software form
------------------------------------------------------------
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS version_edition VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS cost_per_license DECIMAL(12,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS software_name VARCHAR(255);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS device_asset_tag VARCHAR(255);
`;

async function migrate() {
  try {
    console.log('Running migration: add Zoho-matching fields...');
    
    // Execute each ALTER TABLE separately to handle "already exists" gracefully
    const statements = migrations
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        console.log('  ✓', stmt.substring(0, 80).replace(/\n/g, ' '));
      } catch (err) {
        // Column already exists errors are OK
        if (err.code === '42701') {
          console.log('  - Already exists:', stmt.substring(0, 60).replace(/\n/g, ' '));
        } else {
          console.error('  ✗ Error:', err.message, '\n   Statement:', stmt.substring(0, 80));
        }
      }
    }
    
    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
