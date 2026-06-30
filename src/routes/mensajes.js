const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Obtener mensajes de un usuario (conversacion con admin)
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT m.*, u.nombre as remitente_nombre, u.rol as remitente_rol
      FROM mensajes m
      JOIN usuarios u ON m.id_remitente = u.id_usuario
      WHERE m.id_destinatario = $1 OR m.id_remitente = $1
      ORDER BY m.fecha ASC
    `, [req.params.id_usuario]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener mensajes no leidos
router.get('/no-leidos/:id_usuario', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT COUNT(*) as total FROM mensajes WHERE id_destinatario = $1 AND leido = false',
      [req.params.id_usuario]
    );
    res.json({ no_leidos: parseInt(resultado.rows[0].total) });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Enviar mensaje
router.post('/', async (req, res) => {
  try {
    const { id_remitente, id_destinatario, contenido } = req.body;

    if (!id_remitente || !id_destinatario || !contenido) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (contenido.length > 1000) {
      return res.status(400).json({ error: 'El mensaje no debe exceder 1000 caracteres' });
    }

    const resultado = await pool.query(
      'INSERT INTO mensajes (id_remitente, id_destinatario, contenido) VALUES ($1, $2, $3) RETURNING *',
      [id_remitente, id_destinatario, contenido]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar mensajes como leidos
router.patch('/leer/:id_usuario', async (req, res) => {
  try {
    await pool.query(
      'UPDATE mensajes SET leido = true WHERE id_destinatario = $1 AND leido = false',
      [req.params.id_usuario]
    );
    res.json({ mensaje: 'Mensajes marcados como leídos' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Admin: obtener conversaciones (lista de usuarios con mensajes)
router.get('/admin/conversaciones', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT DISTINCT u.id_usuario, u.nombre, u.correo, u.avatar_url,
        (SELECT COUNT(*) FROM mensajes WHERE id_destinatario = $1 AND id_remitente = u.id_usuario AND leido = false) as no_leidos,
        (SELECT contenido FROM mensajes WHERE (id_remitente = u.id_usuario OR id_destinatario = u.id_usuario) AND (id_remitente = $1 OR id_destinatario = $1) ORDER BY fecha DESC LIMIT 1) as ultimo_mensaje
      FROM usuarios u
      WHERE u.id_usuario != $1 AND (
        EXISTS (SELECT 1 FROM mensajes WHERE id_remitente = u.id_usuario AND id_destinatario = $1)
        OR EXISTS (SELECT 1 FROM mensajes WHERE id_destinatario = u.id_usuario AND id_remitente = $1)
      )
      ORDER BY (SELECT fecha FROM mensajes WHERE (id_remitente = u.id_usuario OR id_destinatario = u.id_usuario) AND (id_remitente = $1 OR id_destinatario = $1) ORDER BY fecha DESC LIMIT 1) DESC
    `, [req.query.admin_id]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Admin: obtener chat con un usuario especifico
router.get('/admin/chat/:id_usuario', async (req, res) => {
  try {
    const admin_id = req.query.admin_id;
    const resultado = await pool.query(`
      SELECT m.*, u.nombre as remitente_nombre, u.rol as remitente_rol
      FROM mensajes m
      JOIN usuarios u ON m.id_remitente = u.id_usuario
      WHERE (m.id_remitente = $1 AND m.id_destinatario = $2)
         OR (m.id_remitente = $2 AND m.id_destinatario = $1)
      ORDER BY m.fecha ASC
    `, [admin_id, req.params.id_usuario]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener chat:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
