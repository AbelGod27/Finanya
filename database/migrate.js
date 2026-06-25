/**
 * Script unico de migracion para Finanya
 * Ejecuta el schema completo y configura el primer usuario como admin
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    console.log('Conexion exitosa.');

    // Ejecutar schema completo
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Ejecutando schema...');
    await client.query(schema);
    console.log('Schema ejecutado.');

    // Verificar tablas creadas
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nTablas en la base de datos:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Hacer admin al primer usuario si existe
    const usuarios = await client.query('SELECT id_usuario FROM usuarios LIMIT 1');
    if (usuarios.rows.length > 0) {
      await client.query("UPDATE usuarios SET rol = 'admin' WHERE id_usuario = $1", [usuarios.rows[0].id_usuario]);
      console.log(`\nUsuario #${usuarios.rows[0].id_usuario} configurado como administrador.`);
    }

    client.release();
    await pool.end();
    console.log('\nMigracion completada.');
  } catch (error) {
    console.error('Error durante la migracion:', error.message);
    await pool.end();
    process.exit(1);
  }
}

migrate();
