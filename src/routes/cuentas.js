const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Listar cuentas del usuario
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM cuentas WHERE id_usuario = $1 ORDER BY nombre',
      [req.params.id_usuario]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar cuentas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener saldo total del usuario
router.get('/usuario/:id_usuario/total', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT COALESCE(SUM(saldo_actual), 0) as saldo_total FROM cuentas WHERE id_usuario = $1',
      [req.params.id_usuario]
    );
    res.json({ saldo_total: Number(resultado.rows[0].saldo_total) });
  } catch (error) {
    console.error('Error al obtener saldo total:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear cuenta
router.post('/', async (req, res) => {
  try {
    const { id_usuario, nombre, tipo, saldo_inicial, descripcion } = req.body;

    if (!id_usuario) return res.status(400).json({ error: 'El id_usuario es requerido' });
    if (!nombre || nombre.length === 0 || nombre.length > 100) return res.status(400).json({ error: 'El nombre debe tener entre 1 y 100 caracteres' });
    if (!tipo || !['efectivo', 'banco', 'tarjeta', 'ahorro', 'otro'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser: efectivo, banco, tarjeta, ahorro u otro' });
    }

    const saldo = saldo_inicial !== undefined && !isNaN(saldo_inicial) ? Number(saldo_inicial) : 0;

    const resultado = await pool.query(
      'INSERT INTO cuentas (id_usuario, nombre, tipo, saldo_inicial, saldo_actual, descripcion) VALUES ($1, $2, $3, $4, $4, $5) RETURNING id_cuenta',
      [id_usuario, nombre, tipo, saldo, descripcion || null]
    );

    res.status(201).json({ id_cuenta: resultado.rows[0].id_cuenta, nombre, tipo, saldo_actual: saldo });
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar cuenta
router.put('/:id', async (req, res) => {
  try {
    const id_cuenta = req.params.id;
    const { nombre, tipo, descripcion } = req.body;

    const resultado = await pool.query('SELECT * FROM cuentas WHERE id_cuenta = $1', [id_cuenta]);
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });

    if (nombre !== undefined && (nombre.length === 0 || nombre.length > 100)) {
      return res.status(400).json({ error: 'El nombre debe tener entre 1 y 100 caracteres' });
    }
    if (tipo !== undefined && !['efectivo', 'banco', 'tarjeta', 'ahorro', 'otro'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo invalido' });
    }

    const cuenta = resultado.rows[0];
    const nuevoNombre = nombre || cuenta.nombre;
    const nuevoTipo = tipo || cuenta.tipo;
    const nuevaDesc = descripcion !== undefined ? descripcion : cuenta.descripcion;

    await pool.query(
      'UPDATE cuentas SET nombre = $1, tipo = $2, descripcion = $3 WHERE id_cuenta = $4',
      [nuevoNombre, nuevoTipo, nuevaDesc, id_cuenta]
    );

    res.json({ mensaje: 'Cuenta actualizada' });
  } catch (error) {
    console.error('Error al editar cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar cuenta
router.delete('/:id', async (req, res) => {
  try {
    const id_cuenta = req.params.id;

    const resultado = await pool.query('SELECT * FROM cuentas WHERE id_cuenta = $1', [id_cuenta]);
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });

    await pool.query('DELETE FROM cuentas WHERE id_cuenta = $1', [id_cuenta]);
    res.json({ mensaje: 'Cuenta eliminada' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
