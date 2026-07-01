# Finanya - Gestion Financiera Personal

Aplicacion web completa para gestionar ingresos, gastos, ahorros, presupuestos, cuentas financieras y transferencias. Incluye panel de administracion, analisis financiero, calendario interactivo, graficas, onboarding guiado y modo oscuro.

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
- Subida de archivos: Multer (almacenamiento en BD como Base64)
- Hosting: Render

---

## Funcionalidades

### Usuarios
- Registro con validacion completa
- Inicio de sesion con JWT (24h de expiracion)
- Edicion de perfil (nombre y contrasena)
- Foto de perfil (almacenada como Base64 en la BD, persiste en Render)
- Roles: usuario y administrador
- Categorias por defecto al registrarse (13 categorias)
- Onboarding guiado para nuevos usuarios (7 pasos)

### Ingresos
- Crear, editar, eliminar ingresos
- Asociar a categoria de tipo ingreso
- Asociar a cuenta financiera (opcional, actualiza saldo)
- Listar con orden por fecha

### Gastos
- Crear, editar, eliminar gastos
- Metodo de pago seleccionable (Efectivo, Tarjeta de debito, Tarjeta de credito, Transferencia, Pago movil)
- Asociar a categoria de tipo gasto
- Asociar a cuenta financiera (opcional, actualiza saldo)

### Categorias
- Crear, editar, eliminar categorias
- Tipos: ingreso o gasto
- Filtro por tipo en la interfaz
- Proteccion contra eliminacion si tiene registros asociados

### Cuentas Financieras
- Crear cuentas (efectivo, banco, tarjeta, ahorro, otro)
- Saldo inicial configurable
- Saldo actual se actualiza automaticamente con ingresos, gastos y transferencias
- Editar y eliminar cuentas
- Vista de saldo total

### Transferencias entre Cuentas
- Mover dinero entre cuentas del mismo usuario
- No se registra como ingreso ni gasto
- Validacion de saldo suficiente en cuenta origen
- No permite transferir a la misma cuenta
- Eliminar transferencia revierte los saldos automaticamente

### Metas de Ahorro
- Crear metas con nombre, monto objetivo y fechas
- Registrar aportes hacia cada meta
- Editar nombre, monto objetivo y monto ahorrado
- Barra de progreso visual con porcentaje
- Los aportes se restan del balance disponible

### Presupuestos Mensuales
- Crear presupuesto por categoria de gasto
- Definir limite mensual
- Calculo automatico del gasto actual
- Porcentaje consumido con barra de progreso
- Alerta visual al 80% (amarillo) y al 100% (rojo)
- Resumen de presupuestos en el dashboard

### Dashboard
- Balance del mes (ingresos - gastos - ahorro)
- Total de ingresos, gastos y ahorrado
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
- Variacion porcentual de ingresos y gastos
- Categoria con mayor crecimiento de gasto
- Promedio mensual de ingresos y gastos
- Prediccion de ahorro anual
- Resumen automatico con frases descriptivas
- Detalle por categoria con variaciones

### Calendario Financiero
- Calendario mensual interactivo
- Indicadores por dia (verde=ingresos, rojo=gastos, azul=transferencias)
- Navegacion entre meses
- Dia actual resaltado
- Clic en un dia muestra detalle con lista de movimientos y balance
- Totales del mes visibles

### Panel de Administracion
- Acceso exclusivo para usuarios con rol admin
- Dashboard: total usuarios, activos, ingresos, gastos, metas
- Usuarios mas activos
- Actividad reciente (log de acciones)
- Gestion de usuarios: listar, buscar, activar/desactivar, cambiar rol, eliminar
- Registro de actividad del sistema

### Interfaz y UX
- Paleta azul cielo (#38BDF8)
- Diseno moderno tipo fintech
- Bordes redondeados (12-16px)
- Sombras suaves progresivas
- Tipografia Montserrat
- Animaciones suaves al hover
- Diseno responsive (movil, tablet, escritorio)
- Soporte completo para orientacion landscape en moviles
- Modo oscuro / claro con toggle
- Landing page con hero animado, features y footer
- Toasts de exito/error/advertencia
- Modal de confirmacion antes de eliminar
- Custom select dropdown (reemplaza el select nativo para consistencia visual en Android/iOS)
- Botones con ancho controlado que no se expanden en landscape
- Ayuda contextual con iconos "?" y tooltips
- Onboarding guiado de 7 pasos
- Avatar con inicial o foto
- Boton de mostrar/ocultar contrasena
- Scrollbar personalizado

---

## Estructura del proyecto

```
Finanya-1/
├── database/
│   ├── schema.sql              # Esquema completo de la base de datos
│   └── migrate.js              # Script unico de migracion
├── public/
│   ├── css/styles.css          # Estilos personalizados (fintech theme)
│   ├── js/app.js               # Logica completa del frontend
│   └── index.html              # Pagina principal (SPA)
├── src/
│   ├── config/
│   │   └── db.js               # Conexion a PostgreSQL
│   ├── middlewares/
│   │   ├── autenticacionMiddleware.js  # Verificacion JWT
│   │   ├── autorizacionMiddleware.js   # Verificacion rol admin (403)
│   │   ├── validacionMiddleware.js     # Validacion de datos
│   │   ├── erroresMiddleware.js        # Manejo global de errores
│   │   └── registroMiddleware.js       # Logging de peticiones
│   ├── routes/
│   │   ├── auth.js             # Registro, login, perfil, avatar
│   │   ├── categorias.js       # CRUD categorias
│   │   ├── ingresos.js         # CRUD ingresos + actualizacion de saldo
│   │   ├── gastos.js           # CRUD gastos + actualizacion de saldo
│   │   ├── cuentas.js          # CRUD cuentas financieras
│   │   ├── transferencias.js   # Transferencias entre cuentas
│   │   ├── metas.js            # CRUD metas y aportes
│   │   ├── presupuestos.js     # CRUD presupuestos con alertas
│   │   └── admin.js            # Panel administrativo
│   └── server.js               # Servidor Express con middlewares
├── .env                        # Variables de entorno (no se sube)
├── .gitignore
├── package.json
└── README.md
```

---

## Instalacion

1. Clonar el repositorio:
```bash
git clone https://github.com/AbelGod27/Finanya.git
cd Finanya-1
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` en la raiz:
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

6. Abrir en el navegador: http://localhost:3000

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

### Publicos
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/registro | Registrar usuario |
| POST | /api/auth/login | Iniciar sesion (devuelve JWT) |
| GET | /api/health | Health check |

### Protegidos (JWT)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/auth/perfil/:id | Obtener perfil |
| PUT | /api/auth/perfil/:id | Editar perfil |
| POST | /api/auth/perfil/:id/avatar | Subir foto de perfil |
| GET/POST/PUT/DELETE | /api/categorias/* | CRUD categorias |
| GET/POST/PUT/DELETE | /api/ingresos/* | CRUD ingresos |
| GET/POST/PUT/DELETE | /api/gastos/* | CRUD gastos |
| GET/POST/PUT/DELETE | /api/cuentas/* | CRUD cuentas |
| GET/POST/DELETE | /api/transferencias/* | Transferencias |
| GET/POST/PUT/DELETE | /api/metas/* | CRUD metas y aportes |
| GET/POST/PUT/DELETE | /api/presupuestos/* | CRUD presupuestos |

### Administrativos (JWT + admin)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/admin/dashboard | Estadisticas del sistema |
| GET | /api/admin/usuarios | Listar usuarios |
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
| autorizacionMiddleware.js | Verifica rol admin, retorna 403 si no |
| validacionMiddleware.js | Valida datos de registro, ingresos, gastos y metas |
| erroresMiddleware.js | Captura excepciones, responde JSON estandarizado |
| registroMiddleware.js | Log en consola de cada peticion (metodo, ruta, tiempo) |

---

## Deploy en Render

1. Crear base de datos PostgreSQL en Render
2. Crear Web Service conectado al repositorio
3. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Variables: DATABASE_URL (URL interna), JWT_SECRET, JWT_EXPIRES_IN
4. Ejecutar migracion desde consola de Render o con URL externa

---

## Acceso como administrador

El primer usuario se configura como admin al ejecutar la migracion. Al iniciar sesion aparece el boton "Admin" en la barra de navegacion para acceder al panel de gestion.

---

## Seguridad

- Contrasenas cifradas con bcrypt (10 salt rounds)
- JWT con expiracion configurable
- Consultas parametrizadas (prevencion SQL injection)
- Validacion de datos en servidor y cliente
- Middleware de autorizacion por rol
- Variables de entorno para credenciales
- Fotos de perfil como Base64 en BD (sin archivos en disco)
- Imagenes excluidas del repositorio via .gitignore

---

## Autor

Abel Pineda
