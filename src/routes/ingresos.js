const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Listar ingresos con filtros opcionales
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, id_categoria } = req.query;
    let query = 'SELECT i.*, c.nombre as categoria_nombre FROM ingresos i JOIN categorias c ON i.id_categoria = c.id_categoria WHERE i.id_usuario = $1';
    const params = [req.params.id_usuario];
    let paramIndex = 2;

    if (fecha_inicio && fecha_fin) {
      query += ` AND i.fecha BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(fecha_inicio, fecha_fin);
      paramIndex += 2;
    }
    if (id_categoria) {
      query += ` AND i.id_categoria = $${paramIndex}`;
      params.push(id_categoria);
      paramIndex++;
    }

    query += ' ORDER BY i.fecha DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar ingresos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear ingreso
router.post('/', async (req, res) => {
  try {
    const { id_usuario, monto, descripcion, fecha, id_categoria, id_cuenta } = req.body;

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
    if (!id_categoria) {
      return res.status(400).json({ error: 'La categoría es requerida' });
    }

    // Verificar que la categoría pertenece al usuario y es de tipo ingreso
    const catResult = await pool.query(
      'SELECT * FROM categorias WHERE id_categoria = $1 AND id_usuario = $2 AND tipo = $3',
      [id_categoria, id_usuario, 'ingreso']
    );
    if (catResult.rows.length === 0) {
      return res.status(400).json({ error: 'La categoría no es válida para ingresos' });
    }

    const resultado = await pool.query(
      'INSERT INTO ingresos (id_usuario, id_categoria, id_cuenta, monto, descripcion, fecha) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_ingreso',
      [id_usuario, id_categoria, id_cuenta || null, monto, descripcion, fecha]
    );

    // Actualizar saldo de la cuenta si se especifico
    if (id_cuenta) {
      await pool.query('UPDATE cuentas SET saldo_actual = saldo_actual + $1 WHERE id_cuenta = $2', [monto, id_cuenta]);
    }

    res.status(201).json({ id_ingreso: resultado.rows[0].id_ingreso, monto, descripcion, fecha, id_categoria, id_cuenta });
  } catch (error) {
    console.error('Error al crear ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar ingreso
router.put('/:id', async (req, res) => {
  try {
    const id_ingreso = req.params.id;
    const { monto, descripcion, fecha, id_categoria } = req.body;

    const resultado = await pool.query(
      'SELECT * FROM ingresos WHERE id_ingreso = $1',
      [id_ingreso]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    const ingreso = resultado.rows[0];

    if (monto !== undefined && (isNaN(monto) || monto <= 0 || monto > 999999999.99)) {
      return res.status(400).json({ error: 'El monto debe ser un número entre 0.01 y 999,999,999.99' });
    }
    if (descripcion !== undefined && (descripcion.length === 0 || descripcion.length > 255)) {
      return res.status(400).json({ error: 'La descripción no debe estar vacía ni exceder 255 caracteres' });
    }

    if (id_categoria !== undefined) {
      const catResult = await pool.query(
        'SELECT * FROM categorias WHERE id_categoria = $1 AND id_usuario = $2 AND tipo = $3',
        [id_categoria, ingreso.id_usuario, 'ingreso']
      );
      if (catResult.rows.length === 0) {
        return res.status(400).json({ error: 'La categoría no es válida para ingresos' });
      }
    }

    const nuevoMonto = monto || ingreso.monto;
    const nuevaDesc = descripcion || ingreso.descripcion;
    const nuevaFecha = fecha || ingreso.fecha;
    const nuevaCat = id_categoria || ingreso.id_categoria;

    await pool.query(
      'UPDATE ingresos SET monto = $1, descripcion = $2, fecha = $3, id_categoria = $4 WHERE id_ingreso = $5',
      [nuevoMonto, nuevaDesc, nuevaFecha, nuevaCat, id_ingreso]
    );

    res.json({ mensaje: 'Ingreso actualizado' });
  } catch (error) {
    console.error('Error al editar ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar ingreso
router.delete('/:id', async (req, res) => {
  try {
    const id_ingreso = req.params.id;

    const resultado = await pool.query(
      'SELECT * FROM ingresos WHERE id_ingreso = $1',
      [id_ingreso]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    await pool.query('DELETE FROM ingresos WHERE id_ingreso = $1', [id_ingreso]);
    res.json({ mensaje: 'Ingreso eliminado' });
  } catch (error) {
    console.error('Error al eliminar ingreso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
