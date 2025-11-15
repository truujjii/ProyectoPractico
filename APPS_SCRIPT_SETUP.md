# Configuración de Google Apps Script para Sincronización Bidireccional

## Paso 1: Abrir el Editor de Apps Script

1. Ve a tu Google Sheet: https://docs.google.com/spreadsheets/d/1RnD7UmG-X3UjzwM7-Dobk9JBhl3r61nBgEdw9IDPYws/edit
2. En el menú superior, haz clic en **Extensiones** → **Apps Script**
3. Se abrirá el editor de Apps Script en una nueva pestaña

## Paso 2: Copiar el Código

1. En el editor de Apps Script, verás un archivo llamado `Code.gs`
2. **Borra todo el código** que viene por defecto
3. **Copia y pega** el contenido completo del archivo `google-apps-script/Code.gs` de este proyecto
4. Guarda el proyecto (Ctrl+S o Cmd+S)

## Paso 3: Desplegar como Web App

1. En el editor de Apps Script, haz clic en el botón **Implementar** (arriba a la derecha)
2. Selecciona **Nueva implementación**
3. En "Tipo", haz clic en el icono de engranaje ⚙️ y selecciona **Aplicación web**
4. Configura:
   - **Descripción**: "Smart UNI-BOT Sync API"
   - **Ejecutar como**: "Yo" (tu cuenta)
   - **Quién tiene acceso**: "Cualquier usuario"
5. Haz clic en **Implementar**
6. **Autoriza la aplicación** si te lo pide:
   - Haz clic en "Revisar permisos"
   - Selecciona tu cuenta de Google
   - Haz clic en "Avanzado"
   - Haz clic en "Ir a Smart UNI-BOT Sync (no seguro)"
   - Haz clic en "Permitir"
7. **Copia la URL de la aplicación web** que aparece (algo como: `https://script.google.com/macros/s/AKfycbxxxxx...`)

## Paso 4: Configurar la URL en el Código

1. Abre el archivo `frontend/js/sheets-writer.js`
2. Encuentra la línea:
   ```javascript
   const APPS_SCRIPT_URL = 'TU_URL_DE_APPS_SCRIPT_AQUI';
   ```
3. Reemplaza `'TU_URL_DE_APPS_SCRIPT_AQUI'` con la URL que copiaste en el paso anterior
4. Guarda el archivo

## Paso 5: Commit y Deploy

Ejecuta en la terminal:
```bash
git add -A
git commit -m "Añadir sincronización bidireccional con Google Sheets vía Apps Script"
git push origin main
```

Vercel desplegará automáticamente los cambios.

## Paso 6: Probar la Sincronización Bidireccional

### Probar escritura desde la web:

1. Ve a tu dashboard: https://smart-unibot.vercel.app/dashboard
2. Haz clic en "➕ Añadir Clase"
3. Rellena el formulario y guarda
4. **Ve a tu Google Sheet** → Deberías ver la nueva clase añadida automáticamente ✅

### Probar lectura desde Google Sheets:

1. Añade una fila manualmente en Google Sheets
2. En el dashboard, haz clic en "🔄 Recargar Campus Virtual"
3. **Deberías ver la clase en tu horario** ✅

### Probar borrado:

1. Borra una clase desde el dashboard
2. **Ve a tu Google Sheet** → La fila debería desaparecer ✅

## Solución de Problemas

### Error: "Apps Script URL no configurada"
- Verifica que hayas actualizado la URL en `sheets-writer.js`
- Asegúrate de que la URL es completa y correcta

### Error: "Authorization required"
- Vuelve al paso 3 y asegúrate de autorizar la aplicación
- Puede que necesites hacer clic en "Avanzado" y "Ir a... (no seguro)"

### Error: "Script function not found"
- Asegúrate de haber copiado TODO el código de `Code.gs`
- Guarda el proyecto en Apps Script

### Las clases no aparecen en Google Sheets
- Abre la consola del navegador (F12) y busca errores
- Verifica que la URL de Apps Script es correcta
- Comprueba que el deployment está activo

### CORS errors
- Apps Script maneja CORS automáticamente
- Si ves errores de CORS, verifica que desplegaste como "Aplicación web" con acceso "Cualquier usuario"

## Verificación Final

Ejecuta este comando en la consola del navegador para probar la conexión:

```javascript
fetch('TU_URL_DE_APPS_SCRIPT', {
    method: 'GET',
    redirect: 'follow'
})
.then(r => r.json())
.then(data => console.log('✅ Apps Script funcionando:', data))
.catch(error => console.error('❌ Error:', error));
```

Deberías ver: `✅ Apps Script funcionando: {status: "ok", message: "Smart UNI-BOT Apps Script funcionando"}`
