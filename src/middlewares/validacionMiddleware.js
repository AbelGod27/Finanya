/**
 * Middleware de validacion
 * Valida los datos de entrada para usuarios, ingresos, gastos y metas
 * Retorna error 400 cuando existen datos invalidos
 */

// Validar datos de registro de usuario
const validarUsuario = (req, res, next) => {
  const { nombre, correo, password } = req.body;
  const errores = [];

  // Nombre obligatorio
  if (!nombre || nombre.trim().length === 0) {
    errores.push('El nombre es obligatorio');
  } else if (nombre.length < 2 || nombre.length > 100) {
    errores.push('El nombre debe tener entre 2 y 100 caracteres');
  }

  // Correo electronico valido
  if (!correo || correo.trim().length === 0) {
    errores.push('El correo es obligatorio');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    errores.push('El correo debe tener un formato valido');
  } else if (correo.length > 255) {
    errores.push('El correo no debe exceder 255 caracteres');
  }

  // Contrasena minima de 8 caracteres
  if (!password || password.length < 8) {
    errores.push('La contrasena debe tener al menos 8 caracteres');
  } else if (password.length > 72) {
    errores.push('La contrasena no debe exceder 72 caracteres');
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

// Validar datos de ingreso
const validarIngreso = (req, res, next) => {
  const { monto, fecha, descripcion, id_categoria } = req.body;
  const errores = [];

  // Monto mayor a 0
  if (!monto || isNaN(monto) || Number(monto) <= 0) {
    errores.push('El monto debe ser un numero mayor a 0');
  } else if (Number(monto) > 999999999.99) {
    errores.push('El monto no debe exceder 999,999,999.99');
  }

  // Fecha valida
  if (!fecha) {
    errores.push('La fecha es obligatoria');
  } else if (isNaN(Date.parse(fecha))) {
    errores.push('La fecha debe tener un formato valido');
  }

  // Descripcion
  if (!descripcion || descripcion.trim().length === 0) {
    errores.push('La descripcion es obligatoria');
  } else if (descripcion.length > 255) {
    errores.push('La descripcion no debe exceder 255 caracteres');
  }

  // Categoria
  if (!id_categoria) {
    errores.push('La categoria es obligatoria');
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

// Validar datos de gasto
const validarGasto = (req, res, next) => {
  const { monto, fecha, descripcion, metodo_pago, id_categoria } = req.body;
  const errores = [];

  // Monto mayor a 0
  if (!monto || isNaN(monto) || Number(monto) <= 0) {
    errores.push('El monto debe ser un numero mayor a 0');
  } else if (Number(monto) > 999999999.99) {
    errores.push('El monto no debe exceder 999,999,999.99');
  }

  // Fecha valida
  if (!fecha) {
    errores.push('La fecha es obligatoria');
  } else if (isNaN(Date.parse(fecha))) {
    errores.push('La fecha debe tener un formato valido');
  }

  // Descripcion
  if (!descripcion || descripcion.trim().length === 0) {
    errores.push('La descripcion es obligatoria');
  } else if (descripcion.length > 255) {
    errores.push('La descripcion no debe exceder 255 caracteres');
  }

  // Metodo de pago
  if (!metodo_pago || metodo_pago.trim().length === 0) {
    errores.push('El metodo de pago es obligatorio');
  }

  // Categoria
  if (!id_categoria) {
    errores.push('La categoria es obligatoria');
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

// Validar datos de meta de ahorro
const validarMeta = (req, res, next) => {
  const { nombre, monto_objetivo, fecha_inicio, fecha_limite } = req.body;
  const errores = [];

  // Nombre
  if (!nombre || nombre.trim().length === 0) {
    errores.push('El nombre de la meta es obligatorio');
  } else if (nombre.length > 100) {
    errores.push('El nombre no debe exceder 100 caracteres');
  }

  // Monto objetivo mayor a 0
  if (!monto_objetivo || isNaN(monto_objetivo) || Number(monto_objetivo) <= 0) {
    errores.push('El monto objetivo debe ser un numero mayor a 0');
  } else if (Number(monto_objetivo) > 999999999.99) {
    errores.push('El monto objetivo no debe exceder 999,999,999.99');
  }

  // Fechas
  if (!fecha_inicio) {
    errores.push('La fecha de inicio es obligatoria');
  }
  if (!fecha_limite) {
    errores.push('La fecha limite es obligatoria');
  }
  if (fecha_inicio && fecha_limite && new Date(fecha_limite) <= new Date(fecha_inicio)) {
    errores.push('La fecha limite debe ser posterior a la fecha de inicio');
  }

  if (errores.length > 0) {
    return res.status(400).json({ exito: false, errores });
  }

  next();
};

module.exports = {
  validarUsuario,
  validarIngreso,
  validarGasto,
  validarMeta
};
