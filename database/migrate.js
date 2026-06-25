const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    console.log('Conexión exitosa!');

    // Leer el archivo schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Ejecutando schema...');
    await client.query(schema);
    console.log('Schema ejecutado exitosamente! Tablas creadas.');

    // Verificar tablas creadas
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\nTablas en la base de datos:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    client.release();
    await pool.end();
    console.log('\nMigración completada!');
  } catch (error) {
    console.error('Error durante la migración:', error.message);
    await pool.end();
    process.exit(1);
  }
}

migrate();
