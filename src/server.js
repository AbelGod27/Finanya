const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas
const authRoutes = require('./routes/auth');
const categoriasRoutes = require('./routes/categorias');
const ingresosRoutes = require('./routes/ingresos');
const gastosRoutes = require('./routes/gastos');
const metasRoutes = require('./routes/metas');

app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/metas', metasRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Finanya corriendo en puerto ${PORT}`);
});
