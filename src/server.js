const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Rate limiting para login y registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
});

// Middlewares globales
const registroMiddleware = require('./middlewares/registroMiddleware');
const erroresMiddleware = require('./middlewares/erroresMiddleware');
const autenticacionMiddleware = require('./middlewares/autenticacionMiddleware');

// Aplicar middleware de registro globalmente
app.use(registroMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas publicas con rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/registro', authLimiter);

// Rutas publicas (no requieren autenticacion)
const authRoutes = require('./routes/auth');
const recuperacionRoutes = require('./routes/recuperacion');
app.use('/api/auth', authRoutes);
app.use('/api/recuperacion', recuperacionRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas protegidas (requieren autenticacion)
const categoriasRoutes = require('./routes/categorias');
const ingresosRoutes = require('./routes/ingresos');
const gastosRoutes = require('./routes/gastos');
const metasRoutes = require('./routes/metas');
const presupuestosRoutes = require('./routes/presupuestos');
const cuentasRoutes = require('./routes/cuentas');
const transferenciasRoutes = require('./routes/transferencias');
const adminRoutes = require('./routes/admin');
const autorizacionAdmin = require('./middlewares/autorizacionMiddleware');

app.use('/api/categorias', autenticacionMiddleware, categoriasRoutes);
app.use('/api/ingresos', autenticacionMiddleware, ingresosRoutes);
app.use('/api/gastos', autenticacionMiddleware, gastosRoutes);
app.use('/api/metas', autenticacionMiddleware, metasRoutes);
app.use('/api/presupuestos', autenticacionMiddleware, presupuestosRoutes);
app.use('/api/cuentas', autenticacionMiddleware, cuentasRoutes);
app.use('/api/transferencias', autenticacionMiddleware, transferenciasRoutes);
const mensajesRoutes = require('./routes/mensajes');
app.use('/api/mensajes', autenticacionMiddleware, mensajesRoutes);
app.use('/api/admin', autenticacionMiddleware, autorizacionAdmin, adminRoutes);

// Middleware global de errores (debe ir al final)
app.use(erroresMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Finanya corriendo en puerto ${PORT}`);
});
