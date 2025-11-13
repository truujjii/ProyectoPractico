# 🤖 Smart UNI-BOT

**Plataforma de gestión académica para estudiantes de la Universitat Autònoma de Barcelona (UAB)**

Sistema web completo para gestionar horarios de clases, tareas académicas y consultas mediante chatbot inteligente.

---

## 🎨 Identidad Visual UAB

**Colores oficiales:**
- 🟢 Verde principal: `#1E6B52`
- 🟢 Verde oscuro: `#144B39`
- 🟢 Verde claro: `#88C408`
- ⚪ Blanco: `#FFFFFF`
- ⬛ Gris oscuro: `#333333`

---

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Azure Functions (Node.js v18+)
- **Base de Datos**: Azure SQL Database
- **Hosting**: Azure Static Web Apps
- **CI/CD**: GitHub Actions

### Estructura del Proyecto

```
smart-unibot/
├── frontend/                   # Aplicación web
│   ├── index.html             # Login/Registro
│   ├── dashboard.html         # Dashboard principal
│   ├── chatbot.html           # Interfaz chatbot
│   ├── css/
│   │   ├── styles.css         # Estilos globales
│   │   ├── dashboard.css      # Estilos dashboard
│   │   └── chatbot.css        # Estilos chatbot
│   └── js/
│       ├── auth.js            # Autenticación
│       ├── dashboard.js       # Lógica dashboard
│       ├── chatbot.js         # Lógica chatbot
│       ├── api.js             # Cliente API
│       └── utils.js           # Utilidades
├── api/                       # Azure Functions
│   ├── auth/
│   │   ├── login.js          # POST /api/auth/login
│   │   ├── register.js       # POST /api/auth/register
│   │   └── logout.js         # POST /api/auth/logout
│   ├── schedule/
│   │   ├── getSchedule.js    # GET /api/schedule/getSchedule
│   │   ├── createClass.js    # POST /api/schedule/createClass
│   │   ├── updateClass.js    # PUT /api/schedule/updateClass
│   │   ├── deleteClass.js    # DELETE /api/schedule/deleteClass
│   │   └── clearSemester.js  # DELETE /api/schedule/clearSemester
│   ├── tasks/
│   │   ├── getTasks.js       # GET /api/tasks/getTasks
│   │   ├── createTask.js     # POST /api/tasks/createTask
│   │   ├── updateTask.js     # PUT /api/tasks/updateTask
│   │   └── deleteTask.js     # DELETE /api/tasks/deleteTask
│   └── chatbot/
│       └── query.js          # POST /api/chatbot/query
├── database/
│   └── schema.sql            # Schema de base de datos
├── package.json
├── .gitignore
├── staticwebapp.config.json  # Config Azure Static Web Apps
└── README.md
```

---

## 🚀 Instalación Local

### Requisitos Previos

- **Node.js** v18 o superior
- **npm** v9 o superior
- **Azure Functions Core Tools** v4
- **Azure CLI** (opcional, para deployment)

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/truujjii/smart-unibot.git
cd smart-unibot
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `local.settings.json` en la raíz:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SQL_SERVER": "tu-servidor.database.windows.net",
    "SQL_DATABASE": "SmartUniBotDB",
    "SQL_USER": "tu-usuario",
    "SQL_PASSWORD": "tu-contraseña"
  }
}
```

4. **Configurar base de datos**

Ejecutar el script SQL en Azure SQL Database:

```bash
# Conectar a Azure SQL
sqlcmd -S tu-servidor.database.windows.net -d SmartUniBotDB -U tu-usuario -P tu-contraseña -i database/schema.sql
```

5. **Iniciar servidor de desarrollo**

```bash
# Terminal 1: Azure Functions
npm start

# Terminal 2: Frontend (servidor estático)
cd frontend
python -m http.server 8080
# O con Node.js
npx http-server -p 8080
```

6. **Abrir en navegador**

```
http://localhost:8080
```

---

## ☁️ Despliegue en Azure

### Opción 1: Azure Static Web Apps (Recomendado)

#### Desde Azure Portal

1. **Crear Static Web App**
   - Portal Azure → Create Resource → Static Web App
   - Nombre: `smart-unibot`
   - Región: West Europe
   - Source: GitHub
   - Organización: `truujjii`
   - Repositorio: `smart-unibot`
   - Branch: `main`
   - Build Presets: Custom
   - App location: `/frontend`
   - API location: `/api`
   - Output location: `/frontend`

2. **Configurar SQL Database**
   - Portal Azure → Create Resource → SQL Database
   - Nombre: `SmartUniBotDB`
   - Servidor: Crear nuevo
   - Región: West Europe
   - Pricing Tier: Basic (5 DTU)
   - Ejecutar `database/schema.sql`

3. **Configurar Application Settings**
   - Static Web App → Configuration → Application settings
   - Añadir:
     - `SQL_SERVER`: `tu-servidor.database.windows.net`
     - `SQL_DATABASE`: `SmartUniBotDB`
     - `SQL_USER`: `tu-usuario`
     - `SQL_PASSWORD`: `tu-contraseña`

4. **Deployment automático**
   - GitHub Actions se configura automáticamente
   - Cada push a `main` → deployment automático

#### Desde Azure CLI

```bash
# 1. Login
az login

# 2. Crear grupo de recursos
az group create --name smart-unibot-rg --location westeurope

# 3. Crear SQL Server
az sql server create \
  --name smart-unibot-sql \
  --resource-group smart-unibot-rg \
  --location westeurope \
  --admin-user sqladmin \
  --admin-password TuPasswordSegura123!

# 4. Crear SQL Database
az sql db create \
  --resource-group smart-unibot-rg \
  --server smart-unibot-sql \
  --name SmartUniBotDB \
  --service-objective Basic

# 5. Permitir acceso desde Azure
az sql server firewall-rule create \
  --resource-group smart-unibot-rg \
  --server smart-unibot-sql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 6. Crear Static Web App
az staticwebapp create \
  --name smart-unibot \
  --resource-group smart-unibot-rg \
  --source https://github.com/truujjii/smart-unibot \
  --location westeurope \
  --branch main \
  --app-location "/frontend" \
  --api-location "/api" \
  --output-location "/frontend"

# 7. Configurar variables de entorno
az staticwebapp appsettings set \
  --name smart-unibot \
  --setting-names \
    SQL_SERVER="smart-unibot-sql.database.windows.net" \
    SQL_DATABASE="SmartUniBotDB" \
    SQL_USER="sqladmin" \
    SQL_PASSWORD="TuPasswordSegura123!"
```

### Opción 2: Deployment Manual con GitHub Actions

El proyecto incluye configuración para GitHub Actions. Al hacer push, se despliega automáticamente.

**Archivo `.github/workflows/azure-static-web-apps.yml`:**

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          api_location: "/api"
          output_location: "/frontend"
```

---

## 📚 Documentación de API

### Autenticación

#### POST /api/auth/register

Registrar nuevo usuario.

**Request:**
```json
{
  "email": "estudiante@uab.cat",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "estudiante@uab.cat"
  },
  "message": "Usuario registrado exitosamente"
}
```

#### POST /api/auth/login

Iniciar sesión.

**Request:**
```json
{
  "email": "estudiante@uab.cat",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-id",
    "user": {
      "userId": 1,
      "email": "estudiante@uab.cat",
      "firstName": "Juan",
      "lastName": "Pérez"
    }
  },
  "message": "Login exitoso"
}
```

#### POST /api/auth/logout

Cerrar sesión.

**Headers:**
```
X-Session-ID: uuid-session-id
```

**Response:**
```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

### Horarios

#### GET /api/schedule/getSchedule

Obtener todas las clases del usuario.

**Headers:**
```
X-Session-ID: uuid-session-id
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "classId": 1,
      "subjectName": "Inteligencia Artificial",
      "dayOfWeek": 1,
      "startTime": "10:00",
      "endTime": "12:00",
      "location": "Aula Q1.1030",
      "professor": "Dr. García"
    }
  ]
}
```

#### POST /api/schedule/createClass

Crear nueva clase.

**Headers:**
```
X-Session-ID: uuid-session-id
```

**Request:**
```json
{
  "subjectName": "Bases de Datos",
  "dayOfWeek": 2,
  "startTime": "14:00",
  "endTime": "16:00",
  "location": "Lab C5.S04",
  "professor": "Dra. Martínez",
  "semesterYear": 2025,
  "semesterPeriod": "Otoño"
}
```

### Tareas

#### GET /api/tasks/getTasks

Obtener tareas del usuario.

**Headers:**
```
X-Session-ID: uuid-session-id
```

**Query Params:**
```
?filter=pending|completed|all
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "taskId": 1,
      "title": "Práctica 1 - IA",
      "description": "Implementar algoritmo A*",
      "relatedSubject": "Inteligencia Artificial",
      "dueDate": "2025-11-20",
      "priority": "Alta",
      "isCompleted": false
    }
  ]
}
```

#### POST /api/tasks/createTask

Crear nueva tarea.

### Chatbot

#### POST /api/chatbot/query

Consultar al chatbot.

**Headers:**
```
X-Session-ID: uuid-session-id
```

**Request:**
```json
{
  "message": "¿Qué clases tengo hoy?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hoy tienes las siguientes clases:\n\n1. Inteligencia Artificial - 10:00-12:00 (Aula Q1.1030)\n2. Bases de Datos - 14:00-16:00 (Lab C5.S04)"
  }
}
```

---

## 🎯 Funcionalidades

### ✅ Implementado

- [x] Sistema de autenticación (registro/login/logout)
- [x] Dashboard con vista de horarios y tareas
- [x] Gestión completa de horarios (CRUD)
- [x] Gestión completa de tareas (CRUD)
- [x] Chatbot con reconocimiento de patrones
- [x] Responsive design
- [x] Animaciones y efectos hover
- [x] Notificaciones visuales
- [x] Validación de formularios

### 🚧 En Desarrollo

- [ ] Integración con API de IA (GPT) para chatbot avanzado
- [ ] Notificaciones push
- [ ] Exportar horario a PDF
- [ ] Sincronización con Google Calendar
- [ ] Modo oscuro

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
- ✅ Sesiones con expiración (7 días)
- ✅ Validación de inputs en frontend y backend
- ✅ SQL parametrizado (prevención de SQL injection)
- ✅ HTTPS en producción (Azure)
- ✅ CORS configurado correctamente
- ✅ Sanitización de datos de usuario

---

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Linter
npm run lint
```

---

## 📝 Licencia

MIT License - Ver archivo `LICENSE`

---

## 👥 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📞 Soporte

**Autor:** Estudiante UAB  
**Email:** tu.email@estudiants.uab.cat  
**GitHub:** [@truujjii](https://github.com/truujjii)

---

## 🙏 Agradecimientos

- Universitat Autònoma de Barcelona (UAB)
- Microsoft Azure for Students
- Comunidad open-source

---

**⭐ Si te gusta el proyecto, dale una estrella en GitHub!**
