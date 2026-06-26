const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pool = require('../config/db');
const { validarUsuario } = require('../middlewares/validacionMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'finanya_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// Multer en memoria (para guardar como Base64 en BD)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
  }
});

const router = express.Router();

// Registro
router.post('/registro', validarUsuario, async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    // Validaciones
    const errores = [];
    if (!nombre || nombre.length < 2 || nombre.length > 100) {
      errores.push('El nombre debe tener entre 2 y 100 caracteres');
    }
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      errores.push('El correo debe tener un formato válido');
    }
    if (correo && correo.length > 255) {
      errores.push('El correo no debe exceder 255 caracteres');
    }
    if (!password || password.length < 8 || password.length > 72) {
      errores.push('La contraseña debe tener entre 8 y 72 caracteres');
    }

    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    // Verificar correo existente
    const existente = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Cifrar contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Crear usuario
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, correo, password_hash) VALUES ($1, $2, $3) RETURNING id_usuario',
      [nombre, correo, password_hash]
    );

    const id_usuario = resultado.rows[0].id_usuario;

    // Crear categorías por defecto
    const categoriasDefault = [
      { nombre: 'Salario', tipo: 'ingreso' },
      { nombre: 'Freelance', tipo: 'ingreso' },
      { nombre: 'Inversiones', tipo: 'ingreso' },
      { nombre: 'Otros ingresos', tipo: 'ingreso' },
      { nombre: 'Alimentación', tipo: 'gasto' },
      { nombre: 'Transporte', tipo: 'gasto' },
      { nombre: 'Vivienda', tipo: 'gasto' },
      { nombre: 'Servicios', tipo: 'gasto' },
      { nombre: 'Entretenimiento', tipo: 'gasto' },
      { nombre: 'Salud', tipo: 'gasto' },
      { nombre: 'Educación', tipo: 'gasto' },
      { nombre: 'Ropa', tipo: 'gasto' },
      { nombre: 'Otros gastos', tipo: 'gasto' }
    ];

    for (const cat of categoriasDefault) {
      await pool.query(
        'INSERT INTO categorias (id_usuario, nombre, tipo) VALUES ($1, $2, $3)',
        [id_usuario, cat.nombre, cat.tipo]
      );
    }

    // Crear cuentas por defecto
    const cuentasDefault = [
      { nombre: 'Efectivo', tipo: 'efectivo', descripcion: 'Dinero en efectivo' },
      { nombre: 'Banco', tipo: 'banco', descripcion: 'Cuenta bancaria principal' }
    ];

    for (const cuenta of cuentasDefault) {
      await pool.query(
        'INSERT INTO cuentas (id_usuario, nombre, tipo, saldo_inicial, saldo_actual, descripcion) VALUES ($1, $2, $3, 0, 0, $4)',
        [id_usuario, cuenta.nombre, cuenta.tipo, cuenta.descripcion]
      );
    }

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      id_usuario
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Validaciones
    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      return res.status(400).json({ error: 'Formato de correo inválido' });
    }

    // Buscar usuario
    const resultado = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = resultado.rows[0];

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar ultimo acceso
    await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = $1', [usuario.id_usuario]);

    // Registrar actividad
    await pool.query(
      'INSERT INTO actividad_log (id_usuario, accion, detalle) VALUES ($1, $2, $3)',
      [usuario.id_usuario, 'inicio_sesion', 'Inicio de sesion exitoso']
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token: jwt.sign({ id_usuario: usuario.id_usuario, correo: usuario.correo }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }),
      usuario: { id_usuario: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
    });
  } catch (error) {
    console.error('Error en login:', error);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Servicio no disponible temporalmente' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil
router.get('/perfil/:id', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id_usuario, nombre, correo, fecha_registro, avatar_url FROM usuarios WHERE id_usuario = $1',
      [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Editar perfil
router.put('/perfil/:id', async (req, res) => {
  try {
    const { nombre, password_actual, password_nueva } = req.body;
    const id_usuario = req.params.id;

    // Validar nombre si se envía
    if (nombre !== undefined) {
      if (!nombre || nombre.length > 100) {
        return res.status(400).json({ error: 'El nombre debe tener entre 1 y 100 caracteres' });
      }
    }

    // Cambiar contraseña si se envía
    if (password_nueva) {
      if (password_nueva.length < 8) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
      }
      if (!password_actual) {
        return res.status(400).json({ error: 'Debe proporcionar la contraseña actual' });
      }

      const resultado = await pool.query('SELECT password_hash FROM usuarios WHERE id_usuario = $1', [id_usuario]);
      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      const coincide = await bcrypt.compare(password_actual, resultado.rows[0].password_hash);
      if (!coincide) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }

      const nuevoHash = await bcrypt.hash(password_nueva, 10);
      await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2', [nuevoHash, id_usuario]);
    }

    // Actualizar nombre si se envía
    if (nombre !== undefined) {
      await pool.query('UPDATE usuarios SET nombre = $1 WHERE id_usuario = $2', [nombre, id_usuario]);
    }

    res.json({ mensaje: 'Perfil actualizado exitosamente' });
  } catch (error) {
    console.error('Error al editar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Subir avatar (guarda como Base64 en la BD)
router.post('/perfil/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó una imagen' });
    }

    const id_usuario = req.params.id;

    // Convertir imagen a Base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    await pool.query('UPDATE usuarios SET avatar_url = $1 WHERE id_usuario = $2', [base64, id_usuario]);

    res.json({ mensaje: 'Avatar actualizado', avatar_url: base64 });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
