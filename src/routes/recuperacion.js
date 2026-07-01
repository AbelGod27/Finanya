const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Resend } = require('resend');
const pool = require('../config/db');

const router = express.Router();

// Configurar Resend (API HTTP, no necesita puertos SMTP)
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend configurado para envío de correos');
} else {
  console.warn('⚠️ RESEND_API_KEY no configurada. Correos deshabilitados.');
}

// Solicitar recuperacion de contrasena
router.post('/solicitar', async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ error: 'El correo es requerido' });
    }

    // Mensaje generico siempre (no revelar si el correo existe)
    const mensajeGenerico = 'Si el correo está registrado, recibirás un enlace de recuperación.';

    // Buscar usuario
    const resultado = await pool.query('SELECT id_usuario, nombre FROM usuarios WHERE correo = $1', [correo]);
    if (resultado.rows.length === 0) {
      return res.json({ mensaje: mensajeGenerico });
    }

    const usuario = resultado.rows[0];

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex');

    // Expiración en 30 minutos
    const fecha_expiracion = new Date(Date.now() + 30 * 60 * 1000);

    // Invalidar tokens anteriores del usuario
    await pool.query(
      'UPDATE recuperacion_password SET utilizado = true WHERE id_usuario = $1 AND utilizado = false',
      [usuario.id_usuario]
    );

    // Guardar token
    await pool.query(
      'INSERT INTO recuperacion_password (id_usuario, token, fecha_expiracion) VALUES ($1, $2, $3)',
      [usuario.id_usuario, token, fecha_expiracion]
    );

    // Construir enlace
    const baseUrl = process.env.APP_URL || 'https://finanya.onrender.com';
    const enlace = `${baseUrl}?reset=${token}`;

    // Enviar correo via Resend
    try {
      if (!resend) {
        console.error('❌ No se puede enviar correo: Resend no configurado');
      } else {
        const { data, error } = await resend.emails.send({
          from: 'Finanya <onboarding@resend.dev>',
          to: [correo],
          subject: 'Recuperación de contraseña - Finanya',
          html: `
            <div style="font-family: 'Montserrat', sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; background: #f8fafc; border-radius: 16px;">
              <h2 style="color: #1e293b; text-align: center;">Recuperar Contraseña</h2>
              <p style="color: #64748b;">Hola <strong>${usuario.nombre}</strong>,</p>
              <p style="color: #64748b;">Recibimos una solicitud para restablecer tu contraseña en Finanya.</p>
              <div style="text-align: center; margin: 2rem 0;">
                <a href="${enlace}" style="background: #38bdf8; color: #0f172a; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Restablecer Contraseña</a>
              </div>
              <p style="color: #94a3b8; font-size: 0.85rem;">Este enlace expira en 30 minutos. Si no solicitaste este cambio, ignora este correo.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;">
              <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">Finanya - Gestión Financiera Personal</p>
            </div>
          `
        });

        if (error) {
          console.error('❌ Error enviando correo:', error.message);
        } else {
          console.log('✅ Correo enviado:', data.id);
        }
      }
    } catch (emailError) {
      console.error('❌ Error enviando correo:', emailError.message);
    }

    res.json({ mensaje: mensajeGenerico });
  } catch (error) {
    console.error('Error en recuperacion:', error.message);
    res.json({ mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación.' });
  }
});

// Validar token
router.get('/validar/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const resultado = await pool.query(
      'SELECT * FROM recuperacion_password WHERE token = $1 AND utilizado = false AND fecha_expiracion > NOW()',
      [token]
    );

    if (resultado.rows.length === 0) {
      return res.status(400).json({ valido: false, error: 'El enlace ha expirado o ya fue utilizado.' });
    }

    res.json({ valido: true });
  } catch (error) {
    console.error('Error validando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Restablecer contrasena
router.post('/restablecer', async (req, res) => {
  try {
    const { token, nueva_password } = req.body;

    if (!token || !nueva_password) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (nueva_password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Validar token
    const resultado = await pool.query(
      'SELECT * FROM recuperacion_password WHERE token = $1 AND utilizado = false AND fecha_expiracion > NOW()',
      [token]
    );

    if (resultado.rows.length === 0) {
      return res.status(400).json({ error: 'El enlace ha expirado o ya fue utilizado.' });
    }

    const registro = resultado.rows[0];

    // Cifrar nueva contrasena
    const password_hash = await bcrypt.hash(nueva_password, 10);

    // Actualizar contrasena del usuario
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2', [password_hash, registro.id_usuario]);

    // Marcar token como utilizado
    await pool.query('UPDATE recuperacion_password SET utilizado = true WHERE id_recuperacion = $1', [registro.id_recuperacion]);

    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error restableciendo contrasena:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
