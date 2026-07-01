const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const router = express.Router();

// ===== DASHBOARD ADMIN =====
router.get('/dashboard', async (req, res) => {
  try {
    const [usuarios, ingresos, gastos, metas, activos] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM usuarios'),
      pool.query('SELECT COUNT(*) as total FROM ingresos'),
      pool.query('SELECT COUNT(*) as total FROM gastos'),
      pool.query('SELECT COUNT(*) as total FROM metas_ahorro'),
      pool.query("SELECT COUNT(*) as total FROM usuarios WHERE activo = true")
    ]);

    // Usuarios registrados por mes (ultimos 6 meses)
    const crecimiento = await pool.query(`
      SELECT DATE_TRUNC('month', fecha_registro) as mes, COUNT(*) as total
      FROM usuarios
      WHERE fecha_registro >= NOW() - INTERVAL '6 months'
      GROUP BY mes ORDER BY mes
    `);

    // Actividad reciente
    const actividad = await pool.query(`
      SELECT al.*, u.nombre, u.correo
      FROM actividad_log al
      JOIN usuarios u ON al.id_usuario = u.id_usuario
      ORDER BY al.fecha DESC LIMIT 20
    `);

    // Usuarios mas activos (por cantidad de registros)
    const masActivos = await pool.query(`
      SELECT u.id_usuario, u.nombre, u.correo,
        (SELECT COUNT(*) FROM ingresos WHERE id_usuario = u.id_usuario) +
        (SELECT COUNT(*) FROM gastos WHERE id_usuario = u.id_usuario) as total_movimientos
      FROM usuarios u
      ORDER BY total_movimientos DESC LIMIT 5
    `);

    res.json({
      estadisticas: {
        total_usuarios: parseInt(usuarios.rows[0].total),
        usuarios_activos: parseInt(activos.rows[0].total),
        total_ingresos: parseInt(ingresos.rows[0].total),
        total_gastos: parseInt(gastos.rows[0].total),
        total_metas: parseInt(metas.rows[0].total)
      },
      crecimiento_usuarios: crecimiento.rows,
      actividad_reciente: actividad.rows,
      usuarios_mas_activos: masActivos.rows
    });
  } catch (error) {
    console.error('Error en dashboard admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== GESTION DE USUARIOS =====
// Listar usuarios con busqueda
router.get('/usuarios', async (req, res) => {
  try {
    const { buscar } = req.query;
    let query = `
      SELECT id_usuario, nombre, correo, rol, activo, fecha_registro, ultimo_acceso, avatar_url,
        (SELECT COUNT(*) FROM ingresos WHERE id_usuario = u.id_usuario) as num_ingresos,
        (SELECT COUNT(*) FROM gastos WHERE id_usuario = u.id_usuario) as num_gastos
      FROM usuarios u
    `;
    const params = [];

    if (buscar) {
      query += ' WHERE nombre ILIKE $1 OR correo ILIKE $1';
      params.push(`%${buscar}%`);
    }

    query += ' ORDER BY fecha_registro DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ver perfil de usuario
router.get('/usuarios/:id', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id_usuario, nombre, correo, rol, activo, fecha_registro, ultimo_acceso, avatar_url,
        (SELECT COUNT(*) FROM ingresos WHERE id_usuario = $1) as num_ingresos,
        (SELECT COUNT(*) FROM gastos WHERE id_usuario = $1) as num_gastos,
        (SELECT COUNT(*) FROM metas_ahorro WHERE id_usuario = $1) as num_metas
      FROM usuarios WHERE id_usuario = $1
    `, [req.params.id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al ver usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar usuario
router.put('/usuarios/:id', async (req, res) => {
  try {
    const { nombre, correo, rol } = req.body;
    const id = req.params.id;

    if (nombre) await pool.query('UPDATE usuarios SET nombre = $1 WHERE id_usuario = $2', [nombre, id]);
    if (correo) await pool.query('UPDATE usuarios SET correo = $1 WHERE id_usuario = $2', [correo, id]);
    if (rol && ['usuario', 'admin'].includes(rol)) await pool.query('UPDATE usuarios SET rol = $1 WHERE id_usuario = $2', [rol, id]);

    // Registrar actividad
    await pool.query(
      'INSERT INTO actividad_log (id_usuario, accion, detalle) VALUES ($1, $2, $3)',
      [req.usuario.id_usuario, 'editar_usuario', `Editado usuario #${id}`]
    );

    res.json({ mensaje: 'Usuario actualizado' });
  } catch (error) {
    console.error('Error al editar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Activar/Desactivar usuario
router.patch('/usuarios/:id/estado', async (req, res) => {
  try {
    const { activo } = req.body;
    await pool.query('UPDATE usuarios SET activo = $1 WHERE id_usuario = $2', [activo, req.params.id]);

    await pool.query(
      'INSERT INTO actividad_log (id_usuario, accion, detalle) VALUES ($1, $2, $3)',
      [req.usuario.id_usuario, activo ? 'activar_usuario' : 'desactivar_usuario', `Usuario #${req.params.id}`]
    );

    res.json({ mensaje: activo ? 'Usuario activado' : 'Usuario desactivado' });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar rol
router.patch('/usuarios/:id/rol', async (req, res) => {
  try {
    const { rol } = req.body;
    if (!['usuario', 'admin'].includes(rol)) {
      return res.status(400).json({ error: 'Rol invalido' });
    }
    await pool.query('UPDATE usuarios SET rol = $1 WHERE id_usuario = $2', [rol, req.params.id]);

    await pool.query(
      'INSERT INTO actividad_log (id_usuario, accion, detalle) VALUES ($1, $2, $3)',
      [req.usuario.id_usuario, 'cambiar_rol', `Usuario #${req.params.id} -> ${rol}`]
    );

    res.json({ mensaje: 'Rol actualizado' });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar usuario
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (parseInt(id) === req.usuario.id_usuario) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);

    await pool.query(
      'INSERT INTO actividad_log (id_usuario, accion, detalle) VALUES ($1, $2, $3)',
      [req.usuario.id_usuario, 'eliminar_usuario', `Eliminado usuario #${id}`]
    );

    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Resetear contraseña de usuario (admin)
router.patch('/usuarios/:id/password', async (req, res) => {
  try {
    const id = req.params.id;
    const { nueva_password } = req.body;

    if (!nueva_password || nueva_password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const password_hash = await bcrypt.hash(nueva_password, 10);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2', [password_hash, id]);

    await pool.query(
      'INSERT INTO actividad_log (id_usuario, accion, detalle) VALUES ($1, $2, $3)',
      [req.usuario.id_usuario, 'reset_password', `Contraseña reseteada para usuario #${id}`]
    );

    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Registro de actividad
router.get('/actividad', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT al.*, u.nombre, u.correo
      FROM actividad_log al
      JOIN usuarios u ON al.id_usuario = u.id_usuario
      ORDER BY al.fecha DESC LIMIT 50
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
