# Finanya - Gestion Financiera Personal

Aplicacion web completa para gestionar ingresos, gastos, ahorros, presupuestos y metas financieras personales. Incluye panel de administracion, analisis financiero, graficas interactivas y modo oscuro.

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
- Subida de archivos: Multer
- Hosting: Render

---

## Funcionalidades

### Usuarios
- Registro con validacion completa
- Inicio de sesion con JWT
- Edicion de perfil (nombre, contrasena)
- Foto de perfil (subida de imagen)
- Roles: usuario y administrador
- Categorias por defecto al registrarse

### Ingresos
- Crear, editar, eliminar ingresos
- Listar con orden por fecha
- Asociar a categoria de tipo ingreso
- Validacion de montos y campos

### Gastos
- Crear, editar, eliminar gastos
- Metodo de pago seleccionable (Efectivo, Tarjeta de debito, Tarjeta de credito, Transferencia, Pago movil)
- Asociar a categoria de tipo gasto
- Validacion completa

### Categorias
- Crear, editar, eliminar categorias
- Tipos: ingreso o gasto
- Filtro por tipo en la interfaz
- Proteccion contra eliminacion si tiene registros asociados
- 13 categorias por defecto al registrarse

### Metas de Ahorro
- Crear metas con nombre, monto objetivo y fechas
- Registrar aportes hacia cada meta
- Barra de progreso visual con porcentaje
- Los aportes se restan del balance disponible

### Presupuestos Mensuales
- Crear presupuesto por categoria de gasto
- Definir limite mensual
- Calculo automatico del gasto actual de la categoria
- Porcentaje consumido con barra de progreso
- Alerta visual al 80% (amarillo) y 100% (rojo)
- Resumen de presupuestos en el dashboard

### Dashboard
- Balance del mes (ingresos - gastos - ahorro)
- Total de ingresos del mes
- Total de gastos del mes
- Total ahorrado en metas
- Categoria con mayor gasto
- Promedio mensual de gastos
- Tasa de ahorro
- Grafica de dona: gastos por categoria
- Grafica de barras: ingresos por mes (6 meses)
- Presupuestos del mes con barras de progreso
- Ultimos 8 movimientos
- Frases motivacionales financieras
- Tarjetas clickeables que navegan a cada seccion

### Analisis Financiero
- Comparacion contra el mes anterior (tabla)
- Variacion porcentual de ingresos
- Variacion porcentual de gastos
- Categoria con mayor crecimiento de gasto
- Promedio mensual de ingresos y gastos
- Prediccion de ahorro anual
- Resumen automatico con frases descriptivas
- Detalle por categoria con variaciones

### Panel de Administracion
- Acceso exclusivo para usuarios con rol admin
- Dashboard administrativo:
  - Total de usuarios registrados
  - Usuarios activos
  - Total de ingresos registrados en el sistema
  - Total de gastos registrados en el sistema
  - Total de metas creadas
  - Usuarios mas activos
  - Actividad reciente del sistema
- Gestion de usuarios:
  - Listar todos los usuarios
  - Buscar por nombre o correo
  - Activar / desactivar usuario
  - Cambiar rol (usuario / admin)
  - Eliminar usuario
- Registro de actividad (log de acciones)

### Interfaz y UX
- Paleta principal azul cielo
- Diseno moderno tipo dashboard
- Bordes redondeados (12px-16px)
- Sombras suaves en tarjetas
- Tipografia Montserrat
- Espaciado amplio
- Animaciones suaves al pasar el mouse
- Diseno responsive (movil, tablet, escritorio)
- Modo oscuro / claro con toggle
- Landing page con hero, features y footer
- Toasts de exito/error/advertencia
- Modal de confirmacion antes de eliminar
- Avatar de usuario con inicial o foto
- Iconos Bootstrap Icons (sin emojis)
- Boton de mostrar/ocultar contrasena

---

## Estructura del proyecto

```
Finanya-1/
├── database/
│   ├── schema.sql          # Esquema completo de la base de datos
│   └── migrate.js          # Script unico de migracion
├── public/
│   ├── css/styles.css      # Estilos personalizados
│   ├── js/app.js           # Logica completa del frontend
│   ├── index.html          # Pagina principal (SPA)
│   └── uploads/avatars/    # Fotos de perfil (ignorado en git)
├── src/
│   ├── config/
│   │   └── db.js           # Conexion a PostgreSQL
│   ├── middlewares/
│   │   ├── autenticacionMiddleware.js  # Verificacion JWT
│   │   ├── autorizacionMiddleware.js   # Verificacion rol admin
│   │   ├── validacionMiddleware.js     # Validacion de datos
│   │   ├── erroresMiddleware.js        # Manejo global de errores
│   │   └── registroMiddleware.js       # Logging de peticiones
│   ├── routes/
│   │   ├── auth.js         # Registro, login, perfil, avatar
│   │   ├── categorias.js   # CRUD categorias
│   │   ├── ingresos.js     # CRUD ingresos
│   │   ├── gastos.js       # CRUD gastos
│   │   ├── metas.js        # CRUD metas y aportes
│   │   ├── presupuestos.js # CRUD presupuestos
│   │   └── admin.js        # Panel administrativo
│   └── server.js           # Servidor Express
├── .env                    # Variables de entorno (no se sube)
├── .gitignore
├── package.json
└── README.md
```

---

## Instalacion

1. Clonar el repositorio:
```bash
git clone <url-del-repositorio>
cd Finanya
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` en la raiz con:
```
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRES_IN=24h
PORT=3000
```

4. Ejecutar la migracion:
```bash
node database/migrate.js
```

5. Iniciar el servidor:
```bash
npm start
```

6. Abrir en el navegador: https://finanya.onrender.com

---

## Variables de entorno

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| DATABASE_URL | URL de conexion a PostgreSQL | postgresql://user:pass@host/db |
| JWT_SECRET | Clave secreta para firmar tokens | mi_clave_secreta_2024 |
| JWT_EXPIRES_IN | Tiempo de expiracion del token | 24h |
| PORT | Puerto del servidor (opcional) | 3000 |

---

## API Endpoints

### Publicos (sin autenticacion)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/registro | Registrar usuario |
| POST | /api/auth/login | Iniciar sesion (devuelve JWT) |
| GET | /api/health | Health check |

### Protegidos (requieren JWT)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/auth/perfil/:id | Obtener perfil |
| PUT | /api/auth/perfil/:id | Editar perfil |
| POST | /api/auth/perfil/:id/avatar | Subir foto de perfil |
| GET | /api/categorias/usuario/:id | Listar categorias |
| POST | /api/categorias | Crear categoria |
| PUT | /api/categorias/:id | Editar categoria |
| DELETE | /api/categorias/:id | Eliminar categoria |
| GET | /api/ingresos/usuario/:id | Listar ingresos |
| POST | /api/ingresos | Crear ingreso |
| PUT | /api/ingresos/:id | Editar ingreso |
| DELETE | /api/ingresos/:id | Eliminar ingreso |
| GET | /api/gastos/usuario/:id | Listar gastos |
| POST | /api/gastos | Crear gasto |
| PUT | /api/gastos/:id | Editar gasto |
| DELETE | /api/gastos/:id | Eliminar gasto |
| GET | /api/metas/usuario/:id | Listar metas |
| GET | /api/metas/:id | Ver meta con aportes |
| POST | /api/metas | Crear meta |
| PUT | /api/metas/:id | Editar meta |
| DELETE | /api/metas/:id | Eliminar meta |
| POST | /api/metas/:id/aportes | Registrar aporte |
| GET | /api/presupuestos/usuario/:id | Listar presupuestos |
| POST | /api/presupuestos | Crear presupuesto |
| PUT | /api/presupuestos/:id | Editar presupuesto |
| DELETE | /api/presupuestos/:id | Eliminar presupuesto |

### Administrativos (requieren JWT + rol admin)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/admin/dashboard | Estadisticas del sistema |
| GET | /api/admin/usuarios | Listar usuarios |
| GET | /api/admin/usuarios/:id | Ver perfil de usuario |
| PUT | /api/admin/usuarios/:id | Editar usuario |
| PATCH | /api/admin/usuarios/:id/estado | Activar/desactivar |
| PATCH | /api/admin/usuarios/:id/rol | Cambiar rol |
| DELETE | /api/admin/usuarios/:id | Eliminar usuario |
| GET | /api/admin/actividad | Registro de actividad |

---

## Middlewares

| Archivo | Funcion |
|---------|---------|
| autenticacionMiddleware.js | Verifica JWT del header Authorization Bearer |
| autorizacionMiddleware.js | Verifica que el usuario tenga rol admin (403 si no) |
| validacionMiddleware.js | Valida datos de registro, ingresos, gastos y metas |
| erroresMiddleware.js | Captura excepciones y responde JSON estandarizado |
| registroMiddleware.js | Log en consola de cada peticion (metodo, ruta, tiempo) |

---

## Deploy en Render

1. Crear base de datos PostgreSQL en Render
2. Crear Web Service conectado al repositorio
3. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Variables de entorno: DATABASE_URL (URL interna), JWT_SECRET, JWT_EXPIRES_IN
4. Ejecutar migracion desde la consola de Render o localmente con la URL externa

---

## Acceso como administrador

El primer usuario registrado se configura automaticamente como administrador al ejecutar la migracion. Para acceder al panel:

1. Iniciar sesion con la cuenta de administrador
2. En la barra de navegacion aparece el boton "Admin" (icono de escudo)
3. Hacer clic para acceder al panel de administracion
4. Desde ahi se pueden gestionar usuarios, ver estadisticas y actividad

---

## Seguridad

- Contrasenas cifradas con bcrypt (10 salt rounds)
- Autenticacion basada en JWT con expiracion configurable
- Consultas parametrizadas para prevenir inyeccion SQL
- Validacion de datos en servidor y cliente
- Middleware de autorizacion por rol
- Variables de entorno para credenciales
- Imagenes subidas excluidas del repositorio via .gitignore
- Rate limiting en endpoints sensibles

---

## Autor

Abel Pineda
