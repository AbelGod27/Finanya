const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Listar categorías del usuario
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM categorias WHERE id_usuario = $1 ORDER BY tipo, nombre',
      [req.params.id_usuario]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear categoría
router.post('/', async (req, res) => {
  try {
    const { id_usuario, nombre, tipo } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ error: 'El id_usuario es requerido' });
    }
    if (!nombre || nombre.length === 0 || nombre.length > 50) {
      return res.status(400).json({ error: 'El nombre debe tener entre 1 y 50 caracteres' });
    }
    if (!['ingreso', 'gasto'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser "ingreso" o "gasto"' });
    }

    const resultado = await pool.query(
      'INSERT INTO categorias (id_usuario, nombre, tipo) VALUES ($1, $2, $3) RETURNING id_categoria',
      [id_usuario, nombre, tipo]
    );

    res.status(201).json({ id_categoria: resultado.rows[0].id_categoria, nombre, tipo });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar categoría
router.put('/:id', async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    const id_categoria = req.params.id;

    const resultado = await pool.query(
      'SELECT * FROM categorias WHERE id_categoria = $1',
      [id_categoria]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    if (nombre !== undefined && (nombre.length === 0 || nombre.length > 50)) {
      return res.status(400).json({ error: 'El nombre debe tener entre 1 y 50 caracteres' });
    }
    if (tipo !== undefined && !['ingreso', 'gasto'].includes(tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser "ingreso" o "gasto"' });
    }

    const nuevoNombre = nombre || resultado.rows[0].nombre;
    const nuevoTipo = tipo || resultado.rows[0].tipo;

    await pool.query(
      'UPDATE categorias SET nombre = $1, tipo = $2 WHERE id_categoria = $3',
      [nuevoNombre, nuevoTipo, id_categoria]
    );

    res.json({ mensaje: 'Categoría actualizada', id_categoria, nombre: nuevoNombre, tipo: nuevoTipo });
  } catch (error) {
    console.error('Error al editar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar categoría
router.delete('/:id', async (req, res) => {
  try {
    const id_categoria = req.params.id;

    const resultado = await pool.query(
      'SELECT * FROM categorias WHERE id_categoria = $1',
      [id_categoria]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar que no tiene registros asociados
    const ingresos = await pool.query('SELECT COUNT(*) as total FROM ingresos WHERE id_categoria = $1', [id_categoria]);
    const gastos = await pool.query('SELECT COUNT(*) as total FROM gastos WHERE id_categoria = $1', [id_categoria]);
    const presupuestos = await pool.query('SELECT COUNT(*) as total FROM presupuestos WHERE id_categoria = $1', [id_categoria]);

    if (parseInt(ingresos.rows[0].total) > 0 || parseInt(gastos.rows[0].total) > 0 || parseInt(presupuestos.rows[0].total) > 0) {
      return res.status(409).json({ error: 'La categoría tiene registros asociados y no puede eliminarse' });
    }

    await pool.query('DELETE FROM categorias WHERE id_categoria = $1', [id_categoria]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
