const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_c8TvpSQ9yqiM@ep-fancy-sunset-aarmq6n1-pooler.westus3.azure.neon.tech/neondb?sslmode=require' });
(async () => {
  const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tickets' ORDER BY ordinal_position");
  console.log('TICKETS:', r.rows.map(c => c.column_name).join(', '));
  await pool.end();
})().catch(e => { console.error(e); process.exit(1); });
