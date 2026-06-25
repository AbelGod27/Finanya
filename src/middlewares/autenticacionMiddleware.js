/**
 * Middleware de autenticacion
 * Verifica el token JWT del encabezado Authorization Bearer
 * y guarda la informacion del usuario en req.usuario
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'finanya_secret_key_2024';

const autenticacionMiddleware = (req, res, next) => {
  // Leer el token desde el encabezado Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso no autorizado. Token no proporcionado.'
    });
  }

  // Extraer el token
  const token = authHeader.split(' ')[1];

  try {
    // Validar el token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Guardar la informacion del usuario en req.usuario
    req.usuario = {
      id_usuario: decoded.id_usuario,
      correo: decoded.correo
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token expirado. Inicie sesion nuevamente.'
      });
    }

    return res.status(401).json({
      exito: false,
      mensaje: 'Token invalido. Acceso no autorizado.'
    });
  }
};

module.exports = autenticacionMiddleware;
