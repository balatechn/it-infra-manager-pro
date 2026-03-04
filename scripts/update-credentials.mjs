import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_c8TvpSQ9yqiM@ep-fancy-sunset-aarmq6n1-pooler.westus3.azure.neon.tech/neondb?sslmode=require',
});

const newEmail = 'bala.techn@gmail.com';
const newPassword = 'Nzt@2026!!%%';

async function main() {
  const hash = await bcrypt.hash(newPassword, 12);
  const res = await pool.query(
    `UPDATE users SET email = $1, password_hash = $2, updated_at = NOW() WHERE email = 'admin@itinfra.com' RETURNING id, email, full_name`,
    [newEmail, hash]
  );
  if (res.rows.length) {
    console.log('✅ Credentials updated:', res.rows[0].email, '-', res.rows[0].full_name);
  } else {
    console.log('No admin@itinfra.com found. Existing users:');
    const r2 = await pool.query('SELECT id, email, full_name FROM users LIMIT 5');
    console.log(r2.rows);
  }
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
