const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Listar transferencias del usuario
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT t.*,
        co.nombre as cuenta_origen_nombre,
        cd.nombre as cuenta_destino_nombre
      FROM transferencias t
      JOIN cuentas co ON t.id_cuenta_origen = co.id_cuenta
      JOIN cuentas cd ON t.id_cuenta_destino = cd.id_cuenta
      WHERE t.id_usuario = $1
      ORDER BY t.fecha DESC
    `, [req.params.id_usuario]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar transferencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear transferencia
router.post('/', async (req, res) => {
  try {
    const { id_usuario, id_cuenta_origen, id_cuenta_destino, monto, fecha, descripcion } = req.body;

    // Validaciones
    if (!id_usuario) return res.status(400).json({ error: 'El id_usuario es requerido' });
    if (!id_cuenta_origen) return res.status(400).json({ error: 'La cuenta de origen es requerida' });
    if (!id_cuenta_destino) return res.status(400).json({ error: 'La cuenta de destino es requerida' });
    if (!monto || isNaN(monto) || Number(monto) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    if (!fecha) return res.status(400).json({ error: 'La fecha es requerida' });

    if (id_cuenta_origen === id_cuenta_destino || Number(id_cuenta_origen) === Number(id_cuenta_destino)) {
      return res.status(400).json({ error: 'No puedes transferir a la misma cuenta' });
    }

    // Verificar que ambas cuentas pertenecen al usuario
    const cuentaOrigen = await pool.query('SELECT * FROM cuentas WHERE id_cuenta = $1 AND id_usuario = $2', [id_cuenta_origen, id_usuario]);
    if (cuentaOrigen.rows.length === 0) return res.status(400).json({ error: 'La cuenta de origen no es valida' });

    const cuentaDestino = await pool.query('SELECT * FROM cuentas WHERE id_cuenta = $1 AND id_usuario = $2', [id_cuenta_destino, id_usuario]);
    if (cuentaDestino.rows.length === 0) return res.status(400).json({ error: 'La cuenta de destino no es valida' });

    // Verificar saldo suficiente
    if (Number(cuentaOrigen.rows[0].saldo_actual) < Number(monto)) {
      return res.status(400).json({ error: 'Saldo insuficiente en la cuenta de origen' });
    }

    // Realizar transferencia
    await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual - $1 WHERE id_cuenta = $2', [monto, id_cuenta_origen]);
    await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual + $1 WHERE id_cuenta = $2', [monto, id_cuenta_destino]);

    const resultado = await pool.query(
      'INSERT INTO transferencias (id_usuario, id_cuenta_origen, id_cuenta_destino, monto, fecha, descripcion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_transferencia',
      [id_usuario, id_cuenta_origen, id_cuenta_destino, monto, fecha, descripcion || null]
    );

    res.status(201).json({
      id_transferencia: resultado.rows[0].id_transferencia,
      mensaje: 'Transferencia realizada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear transferencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar transferencia (revierte saldos)
router.delete('/:id', async (req, res) => {
  try {
    const id_transferencia = req.params.id;

    const resultado = await pool.query('SELECT * FROM transferencias WHERE id_transferencia = $1', [id_transferencia]);
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Transferencia no encontrada' });

    const t = resultado.rows[0];

    // Revertir saldos
    await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual + $1 WHERE id_cuenta = $2', [t.monto, t.id_cuenta_origen]);
    await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual - $1 WHERE id_cuenta = $2', [t.monto, t.id_cuenta_destino]);

    await pool.query('DELETE FROM transferencias WHERE id_transferencia = $1', [id_transferencia]);
    res.json({ mensaje: 'Transferencia eliminada y saldos revertidos' });
  } catch (error) {
    console.error('Error al eliminar transferencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
