-- ================================================
-- FINANYA - Esquema completo de base de datos
-- PostgreSQL
-- ================================================

-- Tipo ENUM para categorias
DO $$ BEGIN
  CREATE TYPE tipo_categoria AS ENUM ('ingreso', 'gasto');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'usuario',
  activo BOOLEAN DEFAULT true,
  avatar_url TEXT DEFAULT NULL,
  ultimo_acceso TIMESTAMP DEFAULT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  tipo tipo_categoria NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla de Cuentas Financieras
CREATE TABLE IF NOT EXISTS cuentas (
  id_cuenta SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'efectivo',
  saldo_inicial DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  saldo_actual DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  descripcion VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla de Ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id_ingreso SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_categoria INT NOT NULL,
  id_cuenta INT DEFAULT NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
  FOREIGN KEY (id_cuenta) REFERENCES cuentas(id_cuenta) ON DELETE SET NULL
);

-- Tabla de Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id_gasto SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_categoria INT NOT NULL,
  id_cuenta INT DEFAULT NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
  FOREIGN KEY (id_cuenta) REFERENCES cuentas(id_cuenta) ON DELETE SET NULL
);

-- Tabla de Metas de Ahorro
CREATE TABLE IF NOT EXISTS metas_ahorro (
  id_meta SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  monto_objetivo DECIMAL(12,2) NOT NULL,
  monto_actual DECIMAL(12,2) DEFAULT 0.00,
  fecha_inicio DATE NOT NULL,
  fecha_limite DATE NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla de Aportes de Ahorro
CREATE TABLE IF NOT EXISTS aportes_ahorro (
  id_aporte SERIAL PRIMARY KEY,
  id_meta INT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NOT NULL,
  descripcion VARCHAR(200),
  FOREIGN KEY (id_meta) REFERENCES metas_ahorro(id_meta) ON DELETE CASCADE
);

-- Tabla de Presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
  id_presupuesto SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_categoria INT NOT NULL,
  monto_limite DECIMAL(12,2) NOT NULL,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
  UNIQUE (id_usuario, id_categoria, mes, anio)
);

-- Tabla de Transferencias entre Cuentas
CREATE TABLE IF NOT EXISTS transferencias (
  id_transferencia SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_cuenta_origen INT NOT NULL,
  id_cuenta_destino INT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATE NOT NULL,
  descripcion VARCHAR(255),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_cuenta_origen) REFERENCES cuentas(id_cuenta),
  FOREIGN KEY (id_cuenta_destino) REFERENCES cuentas(id_cuenta)
);

-- Tabla de Registro de Actividad
CREATE TABLE IF NOT EXISTS actividad_log (
  id_log SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  accion VARCHAR(100) NOT NULL,
  detalle VARCHAR(500),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla de Recuperacion de Contrasena
CREATE TABLE IF NOT EXISTS recuperacion_password (
  id_recuperacion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  fecha_expiracion TIMESTAMP NOT NULL,
  utilizado BOOLEAN DEFAULT false,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
