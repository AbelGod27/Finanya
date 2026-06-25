/**
 * Middleware de autorizacion por rol
 * Solo permite acceso a usuarios con rol de administrador
 * Retorna error 403 si un usuario normal intenta acceder
 */
const pool = require('../config/db');

const autorizacionAdmin = async (req, res, next) => {
  try {
    const id_usuario = req.usuario?.id_usuario;
    if (!id_usuario) {
      return res.status(401).json({ exito: false, mensaje: 'No autenticado' });
    }

    const resultado = await pool.query(
      'SELECT rol FROM usuarios WHERE id_usuario = $1',
      [id_usuario]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ exito: false, mensaje: 'Usuario no encontrado' });
    }

    if (resultado.rows[0].rol !== 'admin') {
      return res.status(403).json({ exito: false, mensaje: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    next();
  } catch (error) {
    console.error('Error en autorizacion:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = autorizacionAdmin;
