const { Pool } = require('pg');
require('dotenv').config();

async function addAvatar() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Agregando columna avatar_url...');
    await pool.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) DEFAULT NULL
    `);
    console.log('Columna avatar_url agregada exitosamente!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addAvatar();
