# Finanya - Gestion Financiera Personal

Aplicacion web completa para gestionar ingresos, gastos, ahorros, presupuestos, cuentas financieras, transferencias y tarjetas de credito. Incluye analisis financiero inteligente, panel de administracion, calendario interactivo, sistema de notificaciones, onboarding guiado y recuperacion de contrasena por correo.

URL de produccion: https://finanya.onrender.com

---

## Tecnologias

- Frontend: HTML5, CSS3, JavaScript vanilla
- Framework CSS: Bootstrap 5.3
- Iconos: Bootstrap Icons
- Graficas: Chart.js 4
- Tipografia: Montserrat (Google Fonts)
- Backend: Node.js + Express
- Base de datos: PostgreSQL (Render)
- Autenticacion: JWT + bcrypt
- Correo: Nodemailer + Gmail SMTP
- Subida de archivos: Multer (Base64 en BD)
- Hosting: Render

---

## Funcionalidades

### Usuarios
- Registro con validacion completa
- Inicio de sesion con JWT (30 dias)
- Recuperacion de contrasena por correo electronico
- Edicion de perfil (nombre y contrasena)
- Foto de perfil (hasta 10MB, almacenada como Base64)
- Roles: usuario y administrador
- Categorias y cuentas por defecto al registrarse
- Onboarding guiado de 7 pasos para nuevos usuarios

### Ingresos
- Crear, editar, eliminar ingresos
- Asociar a categoria y cuenta (obligatorio)
- Descripcion opcional
- Ordenamiento por columnas (fecha, categoria, monto) con flechas
- Actualiza saldo de cuenta automaticamente

### Gastos
- Crear, editar, eliminar gastos
- Metodo de pago seleccionable (Efectivo, Tarjeta de debito, Tarjeta de credito, Transferencia, Pago movil)
- Asociar a categoria y cuenta (obligatorio)
- Validacion de saldo suficiente (o credito disponible para tarjetas de credito)
- Ordenamiento por columnas con flechas
- Descripcion opcional

### Categorias
- Crear, editar, eliminar categorias
- Tipos: ingreso o gasto
- Filtro por tipo en la interfaz
- Proteccion contra eliminacion si tiene registros asociados
- 13 categorias por defecto al registrarse

### Cuentas Financieras
- Tipos: efectivo, banco, tarjeta de debito, tarjeta de credito, ahorro, otro
- Todas empiezan con saldo $0 (dinero entra via ingresos)
- Saldo se actualiza automaticamente con ingresos, gastos y transferencias
- El tipo no se puede cambiar despues de crear la cuenta

### Tarjeta de Credito
- Limite de credito configurable
- Dia de corte y dia de pago opcionales
- Credito disponible = limite - deuda
- No permite gastar si no hay credito disponible
- Deuda visible en la tabla de cuentas
- No se puede cambiar el tipo si tiene deuda pendiente
- Pago de tarjeta desde otra cuenta via transferencias

### Transferencias
- Entre cuentas (mover dinero sin registro de ingreso/gasto)
- Cuenta a Meta (aportar ahorro desde cuenta)
- Meta a Cuenta (retirar ahorro)
- Meta a Meta (redistribuir entre metas)
- Validacion de saldo suficiente en origen
- Eliminar transferencia revierte saldos

### Metas de Ahorro
- Nombre obligatorio, monto objetivo y fechas opcionales
- Registrar aportes (obligatoriamente desde una cuenta)
- Barra de progreso visual
- Editar nombre y monto objetivo (no se puede editar monto ahorrado directamente)
- Eliminar meta devuelve el dinero a una cuenta seleccionada

### Presupuestos Mensuales
- Crear por categoria de gasto con limite mensual
- Calculo automatico del gasto actual
- Barra de progreso con porcentaje
- Alerta al 80% (amarillo) y 100% (rojo)
- Indicador informativo cuando no hay gastos en la categoria

### Dashboard
- Balance, ingresos, gastos y ahorrado del mes
- Grafica de dona: gastos por categoria
- Grafica de barras: ingresos por mes (6 meses)
- Ultimos 5 ingresos y gastos separados
- Tarjetas clickeables que navegan a cada seccion
- Frases motivacionales financieras (30 frases)

### Analisis Financiero Inteligente
- Indicador de Salud Financiera (0-100) con grafico circular
- Tasa de ahorro vs regla del 20%
- Tendencia de gastos de 3 meses consecutivos
- Deteccion de gastos atipicos (outliers por desviacion estandar)
- Estabilidad de ingresos (coeficiente de variacion)
- Concentracion/diversificacion de gastos
- Patron de gasto semanal (dia de mayor gasto)
- Frecuencia de gasto (deteccion de compras impulsivas)
- Gasto promedio por transaccion
- Ratio deuda/patrimonio
- Progreso de metas activas
- Recomendaciones personalizadas
- Tabla comparativa mes actual vs anterior con variaciones
- Detalle por categoria con % del total

### Calendario Financiero
- Vista mensual interactiva con navegacion
- Indicadores por dia (verde=ingresos, rojo=gastos, azul=transferencias)
- Dia actual resaltado
- Detalle al hacer clic en un dia (lista de movimientos + balance)
- Totales del mes (apilados verticalmente en movil)

### Panel de Administracion
- Acceso exclusivo para rol admin (boton visible en movil y escritorio)
- Dashboard: total usuarios, activos, ingresos, gastos, metas
- Usuarios mas activos y actividad reciente
- Gestion de usuarios: listar, buscar, activar/desactivar, cambiar rol, eliminar
- Sistema de notificaciones: admin envia mensajes a usuarios

### Notificaciones (Admin a Usuario)
- Boton flotante arrastrable (campana) con badge de no leidos
- Panel desplegable con burbujas de mensajes
- Solo lectura para el usuario (unidireccional)
- Admin puede enviar desde el panel de administracion
- Polling cada 5 segundos para mensajes nuevos
- Se marcan como leidos al abrir

### Recuperacion de Contrasena
- Formulario "Olvidaste tu contrasena"
- Envio de correo con enlace de restablecimiento (Nodemailer + Gmail)
- Token seguro con expiracion de 30 minutos
- Solo puede usarse una vez
- No revela si el correo existe o no
- Aviso de que el correo puede llegar a spam

### Interfaz y UX
- Paleta azul cielo (#38BDF8)
- Diseno tipo fintech profesional
- Bordes redondeados, sombras suaves
- Tipografia Montserrat
- Animaciones hover suaves
- Responsive completo (movil, tablet, escritorio)
- Modo oscuro/claro con toggle
- Landing page con hero animado
- Toasts de exito/error/advertencia
- Confirmaciones modales personalizadas (Confirmar/Eliminar)
- Ayuda contextual con tooltips (iconos ?)
- Onboarding de 7 pasos
- Boton de mostrar/ocultar contrasena
- Scrollbar personalizado
- Ordenamiento de tablas con flechas clickeables

---

## Estructura del proyecto

```
Finanya-1/
├── database/
│   ├── schema.sql              # Esquema completo
│   └── migrate.js              # Script unico de migracion
├── public/
│   ├── css/styles.css          # Estilos fintech
│   ├── js/app.js               # Logica principal
│   ├── js/analisis.js          # Motor de analisis inteligente
│   └── index.html              # Pagina principal (SPA)
├── src/
│   ├── config/db.js            # Conexion PostgreSQL
│   ├── middlewares/
│   │   ├── autenticacionMiddleware.js
│   │   ├── autorizacionMiddleware.js
│   │   ├── validacionMiddleware.js
│   │   ├── erroresMiddleware.js
│   │   └── registroMiddleware.js
│   ├── routes/
│   │   ├── auth.js             # Registro, login, perfil, avatar
│   │   ├── recuperacion.js     # Recuperacion de contrasena
│   │   ├── categorias.js
│   │   ├── ingresos.js
│   │   ├── gastos.js
│   │   ├── cuentas.js          # CRUD + pago de tarjeta
│   │   ├── transferencias.js   # Entre cuentas y metas
│   │   ├── metas.js            # CRUD + aportes
│   │   ├── presupuestos.js
│   │   ├── mensajes.js         # Notificaciones admin-usuario
│   │   └── admin.js            # Panel administrativo
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## Instalacion

```bash
git clone https://github.com/AbelGod27/Finanya.git
cd Finanya-1
npm install
```

Crear archivo `.env`:
```
DATABASE_URL=postgresql://usuario:password@host:5432/db
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES_IN=30d
PORT=3000
EMAIL_USER=tu@gmail.com
EMAIL_PASS=tu_app_password_de_google
APP_URL=https://finanya.onrender.com
```

Ejecutar migracion y arrancar:
```bash
node database/migrate.js
npm start
```

---

## Deploy en Render

- Build: `npm install`
- Start: `npm start`
- Variables: DATABASE_URL (interna), JWT_SECRET, JWT_EXPIRES_IN, EMAIL_USER, EMAIL_PASS, APP_URL

---

## Seguridad

- Contrasenas cifradas con bcrypt
- JWT con expiracion de 30 dias
- Consultas parametrizadas (SQL injection)
- Validacion en cliente y servidor
- Middleware de autorizacion por rol
- Rate limiting en login/registro (10 intentos / 15 min)
- Rutas de perfil protegidas con JWT
- Usuario desactivado no puede iniciar sesion
- Variables de entorno para credenciales
- Imagenes como Base64 en BD (sin archivos en disco)

---

## App Android

Disponible en repositorio separado: https://github.com/AbelGod27/Finanya-android

WebView nativo que carga la app web con soporte para subida de archivos, sesion persistente y navegacion nativa.

---

## Autor

Proyecto desarrollado como aplicacion de gestion financiera personal para portafolio profesional.
