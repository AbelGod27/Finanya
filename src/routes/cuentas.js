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
    const { id_usuario, nombre, tipo, saldo_inicial, descripcion, limite_credito, fecha_corte, fecha_pago } = req.body;

    if (!id_usuario) return res.status(400).json({ error: 'El id_usuario es requerido' });
    if (!nombre || nombre.length === 0 || nombre.length > 100) return res.status(400).json({ error: 'El nombre debe tener entre 1 y 100 caracteres' });
    if (!tipo || !['efectivo', 'banco', 'tarjeta', 'credito', 'ahorro', 'otro'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser: efectivo, banco, tarjeta, credito, ahorro u otro' });
    }

    // Para tarjeta de credito: saldo inicia en 0 (deuda), se necesita limite
    if (tipo === 'credito') {
      if (!limite_credito || Number(limite_credito) <= 0) {
        return res.status(400).json({ error: 'La tarjeta de crédito requiere un límite de crédito mayor a 0' });
      }
    }

    const saldo = 0; // Siempre empieza en 0, el dinero debe entrar via ingresos
    const limCred = tipo === 'credito' && limite_credito ? Number(limite_credito) : null;
    const fCorte = fecha_corte ? Number(fecha_corte) : null;
    const fPago = fecha_pago ? Number(fecha_pago) : null;

    const resultado = await pool.query(
      'INSERT INTO cuentas (id_usuario, nombre, tipo, saldo_inicial, saldo_actual, limite_credito, fecha_corte, fecha_pago, descripcion) VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8) RETURNING id_cuenta',
      [id_usuario, nombre, tipo, saldo, limCred, fCorte, fPago, descripcion || null]
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

// Pagar tarjeta de credito desde otra cuenta
router.post('/pagar-credito', async (req, res) => {
  try {
    const { id_usuario, id_cuenta_credito, id_cuenta_origen, monto } = req.body;

    if (!id_usuario || !id_cuenta_credito || !id_cuenta_origen || !monto) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (Number(monto) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    if (Number(id_cuenta_credito) === Number(id_cuenta_origen)) {
      return res.status(400).json({ error: 'No puedes pagar con la misma tarjeta' });
    }

    // Verificar tarjeta de credito
    const credito = await pool.query('SELECT * FROM cuentas WHERE id_cuenta = $1 AND id_usuario = $2 AND tipo = $3', [id_cuenta_credito, id_usuario, 'credito']);
    if (credito.rows.length === 0) return res.status(400).json({ error: 'Tarjeta de crédito no encontrada' });

    // Verificar cuenta origen tiene saldo
    const origen = await pool.query('SELECT * FROM cuentas WHERE id_cuenta = $1 AND id_usuario = $2', [id_cuenta_origen, id_usuario]);
    if (origen.rows.length === 0) return res.status(400).json({ error: 'Cuenta de origen no encontrada' });
    if (Number(origen.rows[0].saldo_actual) < Number(monto)) {
      return res.status(400).json({ error: 'Saldo insuficiente en la cuenta de origen' });
    }

    // Verificar que no pague más de la deuda
    const deuda = Math.abs(Number(credito.rows[0].saldo_actual));
    if (Number(monto) > deuda) {
      return res.status(400).json({ error: `La deuda actual es $${deuda.toFixed(2)}. No puedes pagar más de eso.` });
    }

    // Ejecutar pago: descontar de origen, aumentar saldo de credito (reduce deuda)
    await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual - $1 WHERE id_cuenta = $2', [monto, id_cuenta_origen]);
    await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual + $1 WHERE id_cuenta = $2', [monto, id_cuenta_credito]);

    res.json({ mensaje: 'Pago a tarjeta de crédito realizado' });
  } catch (error) {
    console.error('Error al pagar credito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
