const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Listar presupuestos del usuario con gasto actual calculado
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const id_usuario = req.params.id_usuario;

    // Mes y anio actuales por defecto
    const now = new Date();
    const mesActual = mes || (now.getMonth() + 1);
    const anioActual = anio || now.getFullYear();

    // Obtener presupuestos con nombre de categoria
    const resultado = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre
       FROM presupuestos p
       JOIN categorias c ON p.id_categoria = c.id_categoria
       WHERE p.id_usuario = $1 AND p.mes = $2 AND p.anio = $3
       ORDER BY c.nombre`,
      [id_usuario, mesActual, anioActual]
    );

    // Calcular gasto actual por cada presupuesto
    const presupuestos = await Promise.all(resultado.rows.map(async (p) => {
      const gastoResult = await pool.query(
        `SELECT COALESCE(SUM(monto), 0) as total_gastado
         FROM gastos
         WHERE id_usuario = $1 AND id_categoria = $2
         AND EXTRACT(MONTH FROM fecha) = $3
         AND EXTRACT(YEAR FROM fecha) = $4`,
        [id_usuario, p.id_categoria, mesActual, anioActual]
      );
      const gastado = Number(gastoResult.rows[0].total_gastado);
      const porcentaje = Math.round((gastado / Number(p.monto_limite)) * 100);
      return {
        ...p,
        monto_gastado: gastado,
        porcentaje_uso: porcentaje
      };
    }));

    res.json(presupuestos);
  } catch (error) {
    console.error('Error al listar presupuestos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear presupuesto
router.post('/', async (req, res) => {
  try {
    const { id_usuario, id_categoria, monto_limite, mes, anio } = req.body;

    if (!id_usuario) {
      return res.status(400).json({ error: 'El id_usuario es requerido' });
    }
    if (!id_categoria) {
      return res.status(400).json({ error: 'La categoria es requerida' });
    }
    if (!monto_limite || isNaN(monto_limite) || Number(monto_limite) <= 0) {
      return res.status(400).json({ error: 'El monto limite debe ser mayor a 0' });
    }
    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'El mes debe estar entre 1 y 12' });
    }
    if (!anio) {
      return res.status(400).json({ error: 'El anio es requerido' });
    }

    // Verificar que la categoria sea de tipo gasto
    const catResult = await pool.query(
      'SELECT * FROM categorias WHERE id_categoria = $1 AND id_usuario = $2 AND tipo = $3',
      [id_categoria, id_usuario, 'gasto']
    );
    if (catResult.rows.length === 0) {
      return res.status(400).json({ error: 'Los presupuestos solo aplican a categorias de tipo gasto' });
    }

    // Verificar que no exista un presupuesto para esa combinacion
    const existente = await pool.query(
      'SELECT * FROM presupuestos WHERE id_usuario = $1 AND id_categoria = $2 AND mes = $3 AND anio = $4',
      [id_usuario, id_categoria, mes, anio]
    );
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un presupuesto para esa categoria en ese mes' });
    }

    const resultado = await pool.query(
      'INSERT INTO presupuestos (id_usuario, id_categoria, monto_limite, mes, anio) VALUES ($1, $2, $3, $4, $5) RETURNING id_presupuesto',
      [id_usuario, id_categoria, monto_limite, mes, anio]
    );

    res.status(201).json({ id_presupuesto: resultado.rows[0].id_presupuesto, monto_limite, mes, anio });
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar presupuesto
router.put('/:id', async (req, res) => {
  try {
    const id_presupuesto = req.params.id;
    const { monto_limite } = req.body;

    const resultado = await pool.query(
      'SELECT * FROM presupuestos WHERE id_presupuesto = $1',
      [id_presupuesto]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    if (!monto_limite || isNaN(monto_limite) || Number(monto_limite) <= 0) {
      return res.status(400).json({ error: 'El monto limite debe ser mayor a 0' });
    }

    await pool.query(
      'UPDATE presupuestos SET monto_limite = $1 WHERE id_presupuesto = $2',
      [monto_limite, id_presupuesto]
    );

    res.json({ mensaje: 'Presupuesto actualizado' });
  } catch (error) {
    console.error('Error al editar presupuesto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar presupuesto
router.delete('/:id', async (req, res) => {
  try {
    const id_presupuesto = req.params.id;

    const resultado = await pool.query(
      'SELECT * FROM presupuestos WHERE id_presupuesto = $1',
      [id_presupuesto]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    await pool.query('DELETE FROM presupuestos WHERE id_presupuesto = $1', [id_presupuesto]);
    res.json({ mensaje: 'Presupuesto eliminado' });
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
