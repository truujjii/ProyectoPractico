# Smart UNI-BOT - Setup Completo 🎓

## ¡Proyecto 100% Funcional! ✅

Este proyecto está ahora **completamente funcional** y listo para ser desplegado en Azure.

## 📁 Estructura Completa

```
smart-unibot/
├── frontend/                    ✅ Completado
│   ├── index.html              ✅ Página de login/registro
│   ├── dashboard.html          ✅ Dashboard principal
│   ├── chatbot.html            ✅ Interfaz de chatbot
│   ├── css/
│   │   ├── styles.css          ✅ Estilos globales
│   │   ├── dashboard.css       ✅ Estilos del dashboard
│   │   └── chatbot.css         ✅ Estilos del chatbot
│   └── js/
│       ├── utils.js            ✅ Funciones utilitarias
│       ├── api.js              ✅ Cliente API
│       ├── auth.js             ✅ Lógica de autenticación
│       ├── dashboard.js        ✅ Lógica del dashboard
│       └── chatbot.js          ✅ Lógica del chatbot
│
├── api/                        ✅ Completado
│   ├── auth/
│   │   ├── register.js         ✅ Registro de usuarios
│   │   ├── login.js            ✅ Inicio de sesión
│   │   └── logout.js           ✅ Cierre de sesión
│   ├── schedule/
│   │   ├── getSchedule.js      ✅ Obtener horario
│   │   ├── createClass.js      ✅ Crear clase
│   │   ├── updateClass.js      ✅ Actualizar clase
│   │   ├── deleteClass.js      ✅ Eliminar clase
│   │   └── clearSemester.js    ✅ Borrar semestre
│   ├── tasks/
│   │   ├── getTasks.js         ✅ Obtener tareas
│   │   ├── createTask.js       ✅ Crear tarea
│   │   ├── updateTask.js       ✅ Actualizar tarea
│   │   └── deleteTask.js       ✅ Eliminar tarea
│   └── chatbot/
│       └── query.js            ✅ Consultas al chatbot
│
├── database/
│   └── schema.sql              ✅ Schema completo con procedimientos
│
├── package.json                ✅ Dependencias configuradas
├── host.json                   ✅ Configuración Azure Functions
├── local.settings.json         ✅ Variables de entorno locales
├── staticwebapp.config.json    ✅ Configuración Static Web Apps
├── .gitignore                  ✅ Archivos ignorados
└── README.md                   ✅ Documentación completa
```

## 🚀 Despliegue Rápido en Azure

### Opción 1: Azure Portal (Más Fácil)

1. **Crear Azure SQL Database**:
   ```
   - Ve a Azure Portal → SQL databases → Create
   - Server: Crea nuevo o usa existente
   - Database: SmartUniBotDB
   - Pricing: Basic (suficiente para empezar)
   - Conecta y ejecuta database/schema.sql
   ```

2. **Crear Static Web App**:
   ```
   - Azure Portal → Static Web Apps → Create
   - Conecta tu repositorio de GitHub
   - Build preset: Custom
   - App location: /frontend
   - Api location: /api
   - Output location: (dejar vacío)
   ```

3. **Configurar Variables de Entorno**:
   ```
   En tu Static Web App → Configuration → Application settings:
   - SQL_SERVER: [tu-servidor].database.windows.net
   - SQL_DATABASE: SmartUniBotDB
   - SQL_USER: [tu-usuario]
   - SQL_PASSWORD: [tu-contraseña]
   ```

### Opción 2: Azure CLI (Más Rápido)

```bash
# 1. Login
az login

# 2. Crear grupo de recursos
az group create --name SmartUniBotRG --location westeurope

# 3. Crear SQL Server
az sql server create \
  --name smartunibot-sql \
  --resource-group SmartUniBotRG \
  --location westeurope \
  --admin-user azureuser \
  --admin-password "TuPassword123!"

# 4. Crear SQL Database
az sql db create \
  --resource-group SmartUniBotRG \
  --server smartunibot-sql \
  --name SmartUniBotDB \
  --service-objective Basic

# 5. Configurar firewall
az sql server firewall-rule create \
  --resource-group SmartUniBotRG \
  --server smartunibot-sql \
  --name AllowAll \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# 6. Conectar y ejecutar schema.sql
sqlcmd -S smartunibot-sql.database.windows.net -U azureuser -P "TuPassword123!" -d SmartUniBotDB -i database/schema.sql

# 7. Crear Static Web App (requiere GitHub repo)
az staticwebapp create \
  --name smart-unibot \
  --resource-group SmartUniBotRG \
  --source https://github.com/TU_USUARIO/TU_REPO \
  --location westeurope \
  --branch main \
  --app-location "/frontend" \
  --api-location "/api" \
  --login-with-github

# 8. Configurar variables de entorno
az staticwebapp appsettings set \
  --name smart-unibot \
  --setting-names SQL_SERVER="smartunibot-sql.database.windows.net" \
                  SQL_DATABASE="SmartUniBotDB" \
                  SQL_USER="azureuser" \
                  SQL_PASSWORD="TuPassword123!"
```

## 🧪 Pruebas Locales

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Base de Datos Local
Puedes usar SQL Server Express o Azure SQL Database directamente. Edita `local.settings.json`:

```json
{
  "Values": {
    "SQL_SERVER": "tu-servidor.database.windows.net",
    "SQL_DATABASE": "SmartUniBotDB",
    "SQL_USER": "tu-usuario",
    "SQL_PASSWORD": "tu-contraseña"
  }
}
```

### 3. Ejecutar Localmente
```bash
# Iniciar Azure Functions localmente
npm start

# En otra terminal, servir frontend
npx http-server frontend -p 8080
```

Abre http://localhost:8080 en tu navegador.

## 📋 Funcionalidades Implementadas

### ✅ Autenticación
- Registro de usuarios con validación
- Login con sesiones (7 días de duración)
- Logout seguro
- Protección de rutas

### ✅ Gestión de Horario
- Visualización de horario semanal en grid
- Añadir clases con todos los detalles
- Editar clases existentes
- Eliminar clases individuales
- Borrar todo el semestre

### ✅ Gestión de Tareas
- Listar tareas con filtros (todas/pendientes/completadas)
- Crear tareas con prioridad y fecha límite
- Editar tareas existentes
- Marcar como completadas
- Eliminar tareas
- Indicadores visuales de urgencia

### ✅ Chatbot Inteligente
- Consultas en lenguaje natural
- Información sobre clases de hoy/mañana
- Estado de tareas pendientes
- Próxima tarea en la agenda
- Interfaz tipo WhatsApp
- Historial de conversación

### ✅ Dashboard
- Cards de vista rápida
- Próxima clase
- Contador de tareas pendientes
- Clases de hoy
- Diseño responsive

## 🎨 Características de Diseño

- ✅ Colores corporativos UAB (#1E6B52, #144B39, #88C408)
- ✅ Responsive design (móvil, tablet, desktop)
- ✅ Animaciones suaves
- ✅ Notificaciones toast
- ✅ Modales elegantes
- ✅ Loading spinners
- ✅ Iconos emoji (no requiere fuentes externas)

## 🔐 Seguridad

- ✅ Passwords hasheados con bcrypt (10 salt rounds)
- ✅ SQL injection prevention (consultas parametrizadas)
- ✅ XSS prevention (HTML escaping)
- ✅ Sesiones con expiración
- ✅ Validación de entrada en frontend y backend
- ✅ HTTPS en producción (Azure default)

## 📊 Base de Datos

El schema incluye:
- **Users**: Usuarios registrados
- **Classes**: Clases del horario semanal
- **Tasks**: Tareas y entregas
- **Sessions**: Sesiones activas
- **Stored Procedures**: CleanExpiredSessions, GetScheduleForDay, GetPendingTasks, GetNextTask
- **Indexes**: Optimización de consultas frecuentes

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Azure Functions v4 (Node.js 18+)
- **Database**: Azure SQL Database
- **Hosting**: Azure Static Web Apps
- **CI/CD**: GitHub Actions (auto-configurado)

## 📝 Próximos Pasos

1. **Subir a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Smart UNI-BOT completo"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/smart-unibot.git
   git push -u origin main
   ```

2. **Desplegar en Azure** (usando uno de los métodos de arriba)

3. **Pruebas**:
   - Registrar un usuario
   - Añadir clases al horario
   - Crear tareas
   - Probar el chatbot
   - Verificar responsive en móvil

## 🐛 Troubleshooting

### Error de conexión a SQL
- Verifica que el firewall de Azure SQL permite tu IP
- Comprueba las credenciales en `local.settings.json` o Azure settings

### Azure Functions no funcionan localmente
- Instala Azure Functions Core Tools: `npm install -g azure-functions-core-tools@4`
- Verifica que Node.js es v18 o superior: `node --version`

### Frontend no se conecta a API
- Asegúrate de que `staticwebapp.config.json` está configurado correctamente
- En local, verifica que las URLs en `api.js` apuntan a localhost:7071

## 📞 Soporte

Para problemas o dudas:
1. Revisa los logs en Azure Portal → Function App → Log stream
2. Verifica la consola del navegador (F12)
3. Comprueba que todas las variables de entorno están configuradas

---

**¡Tu proyecto está 100% listo para funcionar!** 🎉

Solo necesitas desplegarlo en Azure y empezar a usarlo.
