/**
 * Middleware de registro (logging)
 * Registra en consola informacion de cada solicitud HTTP:
 * metodo, ruta, fecha/hora y tiempo de respuesta
 */

const registroMiddleware = (req, res, next) => {
  const inicio = Date.now();
  const fecha = new Date().toISOString();

  // Cuando la respuesta termine, registrar la informacion
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    const status = res.statusCode;
    const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';

    console.log(
      `${color}[${req.method}]${reset} ${req.originalUrl} - ${status} - ${duracion}ms - ${fecha}`
    );
  });

  next();
};

module.exports = registroMiddleware;
