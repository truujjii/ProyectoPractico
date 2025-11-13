# 🚀 Guía de Despliegue Paso a Paso - Smart UNI-BOT

## ✅ Paso 1: Subir el Código a GitHub (COMPLETADO)

✅ Ya has hecho commit del código localmente. Ahora necesitas:

### 1.1 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `smart-unibot` (o el que prefieras)
3. Descripción: "Plataforma de gestión académica para estudiantes UAB"
4. Visibilidad: **Público** o **Privado** (recomiendo Público para Azure)
5. **NO** marques ninguna opción de inicializar con README, .gitignore, etc.
6. Click en **"Create repository"**

### 1.2 Conectar tu repositorio local con GitHub

Copia y pega estos comandos en la terminal (reemplaza `TU_USUARIO` con tu usuario de GitHub):

```bash
cd "/Users/truujjii/Documents/UAB/Empresa i tecnologia/4t/1r semestre/Tecnologies intel i arc/smart-unibot"

# Añadir el remote (CAMBIA truujjii por tu usuario de GitHub)
git remote add origin https://github.com/truujjii/smart-unibot.git

# Renombrar la rama a main
git branch -M main

# Subir el código
git push -u origin main
```

⚠️ **Nota**: GitHub te pedirá autenticación. Si usas HTTPS, necesitarás un Personal Access Token:
- Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token → Marca "repo" → Generate
- Copia el token y úsalo como contraseña cuando Git te lo pida

---

## 📊 Paso 2: Crear Azure SQL Database

### 2.1 Crear cuenta en Azure (si no tienes)

1. Ve a https://azure.microsoft.com/es-es/free/
2. Click en **"Empiece gratis"**
3. Inicia sesión con tu cuenta Microsoft
4. Completa el registro (necesitarás una tarjeta, pero los primeros 12 meses tienen $200 de crédito gratis)

### 2.2 Crear SQL Server y Base de Datos

1. **Ve a Azure Portal**: https://portal.azure.com
2. En el buscador superior, escribe **"SQL databases"** y selecciónalo
3. Click en **"+ Create"**

#### Configuración:

**Basics tab:**
- **Subscription**: Selecciona tu suscripción
- **Resource group**: Click "Create new" → Nombre: `SmartUniBotRG`
- **Database name**: `SmartUniBotDB`
- **Server**: Click "Create new"
  - **Server name**: `smartunibot-sql-TUAPELLIDO` (debe ser único globalmente)
  - **Location**: `West Europe` (o el más cercano a ti)
  - **Authentication method**: Use SQL authentication
  - **Server admin login**: `azureadmin`
  - **Password**: Crea una contraseña segura (¡GUÁRDALA!)
  - Click **OK**
- **Want to use SQL elastic pool?**: No
- **Compute + storage**: Click "Configure database"
  - Selecciona **"Basic"** (5 DTU, 2GB - suficiente para empezar y cuesta ~$5/mes)
  - Click **Apply**

**Networking tab:**
- **Connectivity method**: Public endpoint
- **Firewall rules**:
  - ✅ **Allow Azure services and resources to access this server**: YES
  - ✅ **Add current client IP address**: YES

**Additional settings tab:**
- **Use existing data**: None
- **Database collation**: Default

4. Click **"Review + create"**
5. Click **"Create"**

⏳ Espera 2-5 minutos mientras se crea...

### 2.3 Configurar Firewall (IMPORTANTE)

1. Una vez creada, ve a tu SQL Server (no la base de datos, el servidor)
2. En el menú izquierdo → **Networking**
3. En la sección **Firewall rules**:
   - Asegúrate de que está marcado: **"Allow Azure services and resources to access this server"**
   - Click en **"+ Add your client IPv4 address"** (tu IP actual)
   - Click **Save**

### 2.4 Conectar y Crear el Schema

Opción A - **Azure Query Editor (Más Fácil)**:

1. Ve a tu base de datos `SmartUniBotDB`
2. En el menú izquierdo → **Query editor (preview)**
3. Login con:
   - **Login**: `azureadmin`
   - **Password**: La contraseña que creaste
4. Copia TODO el contenido del archivo `database/schema.sql`
5. Pégalo en el editor
6. Click **Run**
7. ✅ Verás mensajes de éxito para cada tabla creada

Opción B - **Azure Data Studio** (si prefieres herramienta local):

1. Descarga Azure Data Studio: https://docs.microsoft.com/en-us/sql/azure-data-studio/download
2. Conecta con:
   - **Server**: `smartunibot-sql-TUAPELLIDO.database.windows.net`
   - **Authentication type**: SQL Login
   - **User name**: `azureadmin`
   - **Password**: Tu contraseña
3. Abre el archivo `database/schema.sql`
4. Click en **Run**

### 2.5 Verificar que funciona

En el Query Editor, ejecuta:

```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
```

Deberías ver 4 tablas: `Classes`, `Sessions`, `Tasks`, `Users`

🎉 **¡Base de datos lista!**

---

## 🌐 Paso 3: Crear Azure Static Web App

### 3.1 Crear el recurso

1. En Azure Portal, busca **"Static Web Apps"**
2. Click en **"+ Create"**

#### Configuración:

**Basics tab:**
- **Subscription**: Tu suscripción
- **Resource group**: Selecciona `SmartUniBotRG` (el mismo que antes)
- **Name**: `smart-unibot-web`
- **Plan type**: **Free** (perfecto para empezar)
- **Region**: `West Europe 2` o la disponible más cercana
- **Deployment details**:
  - **Source**: **GitHub**
  - Click **"Sign in with GitHub"** y autoriza Azure
  - **Organization**: Tu usuario de GitHub
  - **Repository**: `smart-unibot` (o el nombre que le pusiste)
  - **Branch**: `main`
- **Build Details**:
  - **Build Presets**: `Custom`
  - **App location**: `/frontend`
  - **Api location**: `/api`
  - **Output location**: *(déjalo vacío)*

3. Click **"Review + create"**
4. Click **"Create"**

⏳ Espera 1-2 minutos...

### 3.2 Verificar el Despliegue

1. Una vez creado, ve al recurso
2. En la página de **Overview**, verás un **URL** como: `https://happy-sea-123abc.azurestaticapps.net`
3. Click en el URL (puede tardar 2-3 minutos en estar listo)
4. **Por ahora verás un error** - es normal, falta configurar las variables de entorno

---

## 🔧 Paso 4: Configurar Variables de Entorno

### 4.1 Obtener la cadena de conexión de SQL

1. Ve a tu SQL Database `SmartUniBotDB`
2. En el menú izquierdo → **Settings** → **Connection strings**
3. Copia la **ADO.NET** connection string
4. Se verá algo así:
```
Server=tcp:smartunibot-sql-TUAPELLIDO.database.windows.net,1433;Initial Catalog=SmartUniBotDB;Persist Security Info=False;User ID=azureadmin;Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

### 4.2 Configurar en Static Web App

1. Ve a tu Static Web App `smart-unibot-web`
2. En el menú izquierdo → **Settings** → **Configuration**
3. Click en **"+ Add"** para cada variable:

**Variable 1:**
- **Name**: `SQL_SERVER`
- **Value**: `smartunibot-sql-TUAPELLIDO.database.windows.net` (solo el servidor, sin tcp: ni puerto)

**Variable 2:**
- **Name**: `SQL_DATABASE`
- **Value**: `SmartUniBotDB`

**Variable 3:**
- **Name**: `SQL_USER`
- **Value**: `azureadmin`

**Variable 4:**
- **Name**: `SQL_PASSWORD`
- **Value**: Tu contraseña de SQL (la que creaste antes)

4. Click **Save** arriba

⏳ Espera 30 segundos para que se apliquen los cambios...

---

## ✅ Paso 5: Probar la Aplicación

### 5.1 Acceder a tu aplicación

1. Ve a tu Static Web App → **Overview**
2. Click en el **URL** (ej: `https://happy-sea-123abc.azurestaticapps.net`)
3. Deberías ver la página de login/registro con los colores UAB 🎓

### 5.2 Registrar un usuario

1. Click en la pestaña **"Registro"**
2. Rellena:
   - Email: tu-email@ejemplo.com
   - Contraseña: mínimo 8 caracteres
   - Nombre y apellido (opcional)
3. Click **"Registrarse"**
4. Si todo va bien, verás: "Registro exitoso. Iniciando sesión..." ✅

### 5.3 Probar funcionalidades

**Dashboard:**
- Añade una clase de prueba (ej: "Arquitecturas Inteligentes", Lunes, 9:00-11:00)
- Añade una tarea (ej: "Entrega Proyecto", fecha futura, prioridad Alta)
- Verifica que aparecen en el horario y lista de tareas

**Chatbot:**
- Click en "💬 Chatbot"
- Pregunta: "¿Qué clases tengo hoy?"
- Pregunta: "¿Cuántas tareas tengo pendientes?"
- Verifica que responde correctamente

---

## 🐛 Troubleshooting

### Error: "No autenticado" al registrarse

**Problema**: Las Azure Functions no están funcionando

**Solución**:
1. Ve a tu Static Web App → **Functions**
2. Verifica que aparecen las funciones (register, login, etc.)
3. Si no aparecen, ve a **GitHub Actions** en tu repo y verifica que el deploy se completó
4. Espera 2-3 minutos después del deploy

### Error de conexión a SQL

**Problema**: No puede conectar a la base de datos

**Solución**:
1. Verifica las variables de entorno en Configuration
2. Verifica que el firewall de SQL permite Azure services
3. Prueba la conexión SQL desde Query Editor

### La página se queda en blanco

**Problema**: Error de JavaScript

**Solución**:
1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Mira si hay errores rojos
4. Verifica que los archivos CSS y JS se están cargando (pestaña **Network**)

### Las Azure Functions devuelven 500

**Problema**: Error en el código del backend

**Solución**:
1. Ve a Static Web App → **Monitor** → **Application Insights**
2. Revisa los logs de errores
3. Verifica que `package.json` tiene todas las dependencias
4. Verifica que `host.json` existe en la raíz

---

## 📊 Monitorización

### Ver logs de las Functions

1. Static Web App → **Monitor** → **Application Insights**
2. Click en **Logs**
3. Puedes ver todas las peticiones y errores

### Ver uso de recursos

1. SQL Database → **Monitoring** → **Metrics**
2. Puedes ver DTU usage, connections, etc.

---

## 💰 Costos Estimados

**Con el plan FREE/Basic:**
- Static Web App: **$0** (plan Free)
- Azure Functions: **$0** (incluidas en Static Web App)
- SQL Database Basic: **~$5/mes** (2GB, 5 DTU)

**Total: ~$5/mes** (+ $200 de crédito gratis los primeros 12 meses)

---

## 🎉 ¡Felicidades!

Tu aplicación Smart UNI-BOT está desplegada y funcionando en Azure.

**URL de tu app**: (Cópiala del Overview de Static Web App)

**Próximos pasos opcionales:**
- Configurar un dominio personalizado
- Añadir autenticación con Azure AD
- Configurar alertas de monitorización
- Escalar la base de datos si crece el uso

---

## 📞 Ayuda Adicional

Si tienes problemas:
1. Revisa los logs en Application Insights
2. Verifica que todas las variables de entorno están bien configuradas
3. Comprueba que el firewall de SQL permite Azure services
4. Mira la consola del navegador (F12) para errores de JavaScript

**Recursos útiles:**
- Documentación Azure Static Web Apps: https://docs.microsoft.com/azure/static-web-apps/
- Documentación Azure SQL: https://docs.microsoft.com/azure/azure-sql/
- GitHub del proyecto: https://github.com/truujjii/smart-unibot
