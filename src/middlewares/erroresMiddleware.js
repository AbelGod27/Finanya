/**
 * Middleware global para manejo de errores
 * Captura excepciones del sistema, las muestra en consola
 * y retorna respuestas JSON estandarizadas
 */

const erroresMiddleware = (err, req, res, next) => {
  // Mostrar error en consola para depuracion
  console.error('------- ERROR -------');
  console.error('Fecha:', new Date().toISOString());
  console.error('Ruta:', req.method, req.originalUrl);
  console.error('Mensaje:', err.message);
  if (err.stack) console.error('Stack:', err.stack);
  console.error('---------------------');

  // Determinar el codigo de estado
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta JSON estandarizada
  res.status(statusCode).json({
    exito: false,
    mensaje: statusCode === 500
      ? 'Error interno del servidor'
      : err.message || 'Ha ocurrido un error'
  });
};

module.exports = erroresMiddleware;
