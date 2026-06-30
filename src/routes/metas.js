const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Listar metas de ahorro
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT *, CASE WHEN monto_objetivo IS NOT NULL AND monto_objetivo > 0 THEN ROUND((monto_actual / monto_objetivo) * 100, 2) ELSE 0 END as porcentaje_avance FROM metas_ahorro WHERE id_usuario = $1',
      [req.params.id_usuario]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar metas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener meta específica con aportes
router.get('/:id', async (req, res) => {
  try {
    const id_meta = req.params.id;

    const resultado = await pool.query(
      'SELECT *, CASE WHEN monto_objetivo IS NOT NULL AND monto_objetivo > 0 THEN ROUND((monto_actual / monto_objetivo) * 100, 2) ELSE 0 END as porcentaje_avance FROM metas_ahorro WHERE id_meta = $1',
      [id_meta]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const aportes = await pool.query(
      'SELECT * FROM aportes_ahorro WHERE id_meta = $1 ORDER BY fecha DESC',
      [id_meta]
    );

    res.json({ ...resultado.rows[0], aportes: aportes.rows });
  } catch (error) {
    console.error('Error al obtener meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear meta de ahorro
router.post('/', async (req, res) => {
  try {
    const { id_usuario, nombre, monto_objetivo, fecha_inicio, fecha_limite } = req.body;

    // Validaciones
    if (!id_usuario) {
      return res.status(400).json({ error: 'El id_usuario es requerido' });
    }
    if (!nombre || nombre.length === 0 || nombre.length > 100) {
      return res.status(400).json({ error: 'El nombre debe tener entre 1 y 100 caracteres' });
    }

    // Monto objetivo es opcional
    if (monto_objetivo !== undefined && monto_objetivo !== '' && (isNaN(monto_objetivo) || Number(monto_objetivo) < 0)) {
      return res.status(400).json({ error: 'El monto objetivo debe ser un número válido' });
    }

    // Validar fechas solo si ambas se proporcionan
    if (fecha_inicio && fecha_limite && new Date(fecha_limite) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha límite debe ser posterior a la fecha de inicio' });
    }

    const montoObj = monto_objetivo && Number(monto_objetivo) > 0 ? Number(monto_objetivo) : null;
    const fInicio = fecha_inicio || null;
    const fLimite = fecha_limite || null;

    const resultado = await pool.query(
      'INSERT INTO metas_ahorro (id_usuario, nombre, monto_objetivo, monto_actual, fecha_inicio, fecha_limite) VALUES ($1, $2, $3, 0, $4, $5) RETURNING id_meta',
      [id_usuario, nombre, montoObj, fInicio, fLimite]
    );

    res.status(201).json({ id_meta: resultado.rows[0].id_meta, nombre, monto_objetivo: montoObj, monto_actual: 0, fecha_inicio: fInicio, fecha_limite: fLimite, porcentaje_avance: 0 });
  } catch (error) {
    console.error('Error al crear meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar meta
router.put('/:id', async (req, res) => {
  try {
    const id_meta = req.params.id;
    const { nombre, monto_objetivo, monto_actual, fecha_limite } = req.body;

    const resultado = await pool.query(
      'SELECT * FROM metas_ahorro WHERE id_meta = $1',
      [id_meta]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const meta = resultado.rows[0];

    if (nombre !== undefined && (nombre.length === 0 || nombre.length > 100)) {
      return res.status(400).json({ error: 'El nombre debe tener entre 1 y 100 caracteres' });
    }
    if (monto_objetivo !== undefined && (isNaN(monto_objetivo) || monto_objetivo <= 0 || monto_objetivo > 999999999.99)) {
      return res.status(400).json({ error: 'El monto objetivo debe ser entre 0.01 y 999,999,999.99' });
    }
    if (monto_actual !== undefined && (isNaN(monto_actual) || Number(monto_actual) < 0)) {
      return res.status(400).json({ error: 'El monto actual no puede ser negativo' });
    }
    if (fecha_limite !== undefined && new Date(fecha_limite) <= new Date(meta.fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha límite debe ser posterior a la fecha de inicio' });
    }

    const nuevoNombre = nombre || meta.nombre;
    const nuevoMontoObj = monto_objetivo || meta.monto_objetivo;
    const nuevoMontoActual = monto_actual !== undefined ? Number(monto_actual) : meta.monto_actual;
    const nuevaFecha = fecha_limite || meta.fecha_limite;

    await pool.query(
      'UPDATE metas_ahorro SET nombre = $1, monto_objetivo = $2, monto_actual = $3, fecha_limite = $4 WHERE id_meta = $5',
      [nuevoNombre, nuevoMontoObj, nuevoMontoActual, nuevaFecha, id_meta]
    );

    res.json({ mensaje: 'Meta actualizada' });
  } catch (error) {
    console.error('Error al editar meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar meta (devuelve el ahorro a una cuenta si se indica)
router.delete('/:id', async (req, res) => {
  try {
    const id_meta = req.params.id;
    const { id_cuenta } = req.query;

    const resultado = await pool.query(
      'SELECT * FROM metas_ahorro WHERE id_meta = $1',
      [id_meta]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const meta = resultado.rows[0];

    // Si hay monto ahorrado y se indica cuenta, devolver el dinero
    if (Number(meta.monto_actual) > 0 && id_cuenta) {
      await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual + $1 WHERE id_cuenta = $2', [meta.monto_actual, id_cuenta]);
    }

    await pool.query('DELETE FROM metas_ahorro WHERE id_meta = $1', [id_meta]);
    res.json({ mensaje: 'Meta eliminada', monto_devuelto: id_cuenta ? Number(meta.monto_actual) : 0 });
  } catch (error) {
    console.error('Error al eliminar meta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registrar aporte
router.post('/:id/aportes', async (req, res) => {
  try {
    const id_meta = req.params.id;
    const { monto, descripcion, id_cuenta } = req.body;

    // Verificar que la meta existe
    const metaResult = await pool.query(
      'SELECT * FROM metas_ahorro WHERE id_meta = $1',
      [id_meta]
    );
    if (metaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    if (!monto || isNaN(monto) || monto <= 0 || monto > 999999999.99) {
      return res.status(400).json({ error: 'El monto debe ser entre 0.01 y 999,999,999.99' });
    }
    if (descripcion && descripcion.length > 200) {
      return res.status(400).json({ error: 'La descripción no debe exceder 200 caracteres' });
    }

    // Si se especifica cuenta, verificar saldo y descontar
    if (id_cuenta) {
      const cuentaResult = await pool.query('SELECT saldo_actual FROM cuentas WHERE id_cuenta = $1', [id_cuenta]);
      if (cuentaResult.rows.length === 0) {
        return res.status(400).json({ error: 'Cuenta no encontrada' });
      }
      if (Number(cuentaResult.rows[0].saldo_actual) < Number(monto)) {
        return res.status(400).json({ error: 'Saldo insuficiente en la cuenta seleccionada' });
      }
      await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual - $1 WHERE id_cuenta = $2', [monto, id_cuenta]);
    }

    const fecha = new Date().toISOString().split('T')[0];

    const resultado = await pool.query(
      'INSERT INTO aportes_ahorro (id_meta, monto, fecha, descripcion) VALUES ($1, $2, $3, $4) RETURNING id_aporte',
      [id_meta, monto, fecha, descripcion || null]
    );

    // Actualizar monto actual de la meta
    await pool.query(
      'UPDATE metas_ahorro SET monto_actual = monto_actual + $1 WHERE id_meta = $2',
      [monto, id_meta]
    );

    const metaActualizada = await pool.query(
      'SELECT monto_actual, monto_objetivo, ROUND((monto_actual / monto_objetivo) * 100, 2) as porcentaje_avance FROM metas_ahorro WHERE id_meta = $1',
      [id_meta]
    );

    res.status(201).json({
      id_aporte: resultado.rows[0].id_aporte,
      monto,
      fecha,
      descripcion,
      meta: metaActualizada.rows[0]
    });
  } catch (error) {
    console.error('Error al registrar aporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
