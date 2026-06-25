-- Crear base de datos
-- CREATE DATABASE finanya;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tipo ENUM simulado con CHECK constraint
CREATE TYPE tipo_categoria AS ENUM ('ingreso', 'gasto');

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  tipo tipo_categoria NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla de Ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id_ingreso SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_categoria INT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- Tabla de Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id_gasto SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_categoria INT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
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
