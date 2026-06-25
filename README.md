# Finanya - Gestion Financiera Personal

Aplicacion web para gestionar ingresos, gastos, ahorros y presupuestos personales.

## Tecnologias

- Frontend: HTML, CSS, JavaScript, Bootstrap 5, Chart.js
- Backend: Node.js + Express
- Base de datos: PostgreSQL (Render)
- Cifrado: bcrypt
- Tipografia: Montserrat

## Funcionalidades

- Registro e inicio de sesion de usuarios
- Categorias personalizadas (ingreso/gasto) con categorias por defecto al registrarse
- Registro de ingresos con monto, descripcion, fecha y categoria
- Registro de gastos con monto, descripcion, fecha, metodo de pago y categoria
- Metas de ahorro con aportes y porcentaje de avance
- Dashboard con resumen financiero:
  - Balance del mes
  - Total de ingresos y gastos
  - Total ahorrado
  - Categoria con mayor gasto
  - Promedio mensual de gastos
  - Tasa de ahorro
  - Grafica de gastos por categoria (dona)
  - Grafica de ingresos por mes (barras)
  - Ultimos movimientos
- Perfil de usuario con edicion de nombre, contrasena y foto de perfil
- Filtro de categorias por tipo
- Modo oscuro / claro
- Notificaciones toast
- Confirmacion antes de eliminar
- Diseno responsive
- Landing page atractiva
- Frases motivacionales financieras

## Estructura del proyecto

```
Finanya-1/
├── database/
│   ├── schema.sql          # Esquema de la base de datos PostgreSQL
│   ├── migrate.js          # Script para ejecutar el schema en Render
│   └── add-avatar.js       # Migracion para agregar avatar_url
├── public/
│   ├── css/styles.css      # Estilos personalizados
│   ├── js/app.js           # Logica del frontend
│   ├── index.html          # Pagina principal (SPA)
│   └── uploads/avatars/    # Fotos de perfil subidas
├── src/
│   ├── config/db.js        # Conexion a PostgreSQL
│   ├── routes/
│   │   ├── auth.js         # Registro, login, perfil, avatar
│   │   ├── categorias.js   # CRUD categorias
│   │   ├── ingresos.js     # CRUD ingresos
│   │   ├── gastos.js       # CRUD gastos
│   │   └── metas.js        # CRUD metas y aportes
│   └── server.js           # Servidor Express
├── .env                    # Variables de entorno (no se sube)
├── .gitignore
├── package.json
└── README.md
```

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

3. Configurar variables de entorno:

Crear un archivo `.env` en la raiz del proyecto con:
```
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
PORT=3000
```

4. Ejecutar la migracion de base de datos:
```bash
node database/migrate.js
node database/add-avatar.js
```

5. Iniciar el servidor:
```bash
npm start
```

6. Abrir en el navegador: http://localhost:3000

## Variables de entorno

```
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
PORT=3000
```

## API Endpoints

### Autenticacion
- POST /api/auth/registro - Registrar usuario
- POST /api/auth/login - Iniciar sesion
- GET /api/auth/perfil/:id - Obtener perfil
- PUT /api/auth/perfil/:id - Editar perfil
- POST /api/auth/perfil/:id/avatar - Subir foto de perfil

### Categorias
- GET /api/categorias/usuario/:id_usuario - Listar categorias
- POST /api/categorias - Crear categoria
- PUT /api/categorias/:id - Editar categoria
- DELETE /api/categorias/:id - Eliminar categoria

### Ingresos
- GET /api/ingresos/usuario/:id_usuario - Listar ingresos
- POST /api/ingresos - Crear ingreso
- PUT /api/ingresos/:id - Editar ingreso
- DELETE /api/ingresos/:id - Eliminar ingreso

### Gastos
- GET /api/gastos/usuario/:id_usuario - Listar gastos
- POST /api/gastos - Crear gasto
- PUT /api/gastos/:id - Editar gasto
- DELETE /api/gastos/:id - Eliminar gasto

### Metas de ahorro
- GET /api/metas/usuario/:id_usuario - Listar metas
- GET /api/metas/:id - Obtener meta con aportes
- POST /api/metas - Crear meta
- PUT /api/metas/:id - Editar meta
- DELETE /api/metas/:id - Eliminar meta
- POST /api/metas/:id/aportes - Registrar aporte

## Deploy en Render

1. Crear una base de datos PostgreSQL en Render
2. Crear un Web Service conectado al repositorio
3. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Variable de entorno: `DATABASE_URL` (usar la URL interna de Render)
4. Ejecutar las migraciones desde la consola de Render o localmente con la URL externa

## Autor

Proyecto desarrollado como aplicacion de gestion financiera personal.
