const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Listar gastos con filtros opcionales
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_categoria } = req.query;
    let query = 'SELECT g.*, c.nombre as categoria_nombre FROM gastos g JOIN categorias c ON g.id_categoria = c.id_categoria WHERE g.id_usuario = $1';
    const params = [req.params.id_usuario];
    let paramIndex = 2;

    if (fecha_inicio && fecha_fin) {
      query += ` AND g.fecha BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(fecha_inicio, fecha_fin);
      paramIndex += 2;
    }
    if (id_categoria) {
      query += ` AND g.id_categoria = $${paramIndex}`;
      params.push(id_categoria);
      paramIndex++;
    }

    query += ' ORDER BY g.fecha DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar gastos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear gasto
router.post('/', async (req, res) => {
  try {
    const { id_usuario, monto, descripcion, fecha, metodo_pago, id_categoria } = req.body;

    // Validaciones
    if (!id_usuario) {
      return res.status(400).json({ error: 'El id_usuario es requerido' });
    }
    if (!monto || isNaN(monto) || monto <= 0 || monto > 999999999.99) {
      return res.status(400).json({ error: 'El monto debe ser un número entre 0.01 y 999,999,999.99' });
    }
    if (!descripcion || descripcion.length > 255) {
      return res.status(400).json({ error: 'La descripción es requerida y no debe exceder 255 caracteres' });
    }
    if (!fecha) {
      return res.status(400).json({ error: 'La fecha es requerida' });
    }
    if (!metodo_pago || metodo_pago.length > 50) {
      return res.status(400).json({ error: 'El método de pago es requerido y no debe exceder 50 caracteres' });
    }
    if (!id_categoria) {
      return res.status(400).json({ error: 'La categoría es requerida' });
    }

    // Verificar categoría válida
    const catResult = await pool.query(
      'SELECT * FROM categorias WHERE id_categoria = $1 AND id_usuario = $2 AND tipo = $3',
      [id_categoria, id_usuario, 'gasto']
    );
    if (catResult.rows.length === 0) {
      return res.status(400).json({ error: 'La categoría no es válida para gastos' });
    }

    const resultado = await pool.query(
      'INSERT INTO gastos (id_usuario, id_categoria, monto, descripcion, fecha, metodo_pago) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_gasto',
      [id_usuario, id_categoria, monto, descripcion, fecha, metodo_pago]
    );

    res.status(201).json({ id_gasto: resultado.rows[0].id_gasto, monto, descripcion, fecha, metodo_pago, id_categoria });
  } catch (error) {
    console.error('Error al crear gasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar gasto
router.put('/:id', async (req, res) => {
  try {
    const id_gasto = req.params.id;
    const { monto, descripcion, fecha, metodo_pago, id_categoria } = req.body;

    const resultado = await pool.query(
      'SELECT * FROM gastos WHERE id_gasto = $1',
      [id_gasto]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    const gasto = resultado.rows[0];

    if (monto !== undefined && (isNaN(monto) || monto <= 0 || monto > 999999999.99)) {
      return res.status(400).json({ error: 'El monto debe ser un número entre 0.01 y 999,999,999.99' });
    }
    if (descripcion !== undefined && (descripcion.length === 0 || descripcion.length > 255)) {
      return res.status(400).json({ error: 'La descripción no debe estar vacía ni exceder 255 caracteres' });
    }

    if (id_categoria !== undefined) {
      const catResult = await pool.query(
        'SELECT * FROM categorias WHERE id_categoria = $1 AND id_usuario = $2 AND tipo = $3',
        [id_categoria, gasto.id_usuario, 'gasto']
      );
      if (catResult.rows.length === 0) {
        return res.status(400).json({ error: 'La categoría no es válida para gastos' });
      }
    }

    const nuevoMonto = monto || gasto.monto;
    const nuevaDesc = descripcion || gasto.descripcion;
    const nuevaFecha = fecha || gasto.fecha;
    const nuevoMetodo = metodo_pago || gasto.metodo_pago;
    const nuevaCat = id_categoria || gasto.id_categoria;

    await pool.query(
      'UPDATE gastos SET monto = $1, descripcion = $2, fecha = $3, metodo_pago = $4, id_categoria = $5 WHERE id_gasto = $6',
      [nuevoMonto, nuevaDesc, nuevaFecha, nuevoMetodo, nuevaCat, id_gasto]
    );

    res.json({ mensaje: 'Gasto actualizado' });
  } catch (error) {
    console.error('Error al editar gasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar gasto
router.delete('/:id', async (req, res) => {
  try {
    const id_gasto = req.params.id;

    const resultado = await pool.query(
      'SELECT * FROM gastos WHERE id_gasto = $1',
      [id_gasto]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    await pool.query('DELETE FROM gastos WHERE id_gasto = $1', [id_gasto]);
    res.json({ mensaje: 'Gasto eliminado' });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
