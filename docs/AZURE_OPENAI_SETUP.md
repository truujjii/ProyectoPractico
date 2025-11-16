# Configuración de Azure OpenAI para Smart UNI-BOT

## 📋 Requisitos previos

1. **GitHub Student Developer Pack** (ya lo tienes ✅)
2. Cuenta de Azure activada con créditos de estudiante

---

## 🚀 Paso 1: Activar Azure con GitHub Student Pack

1. Ve a https://portal.azure.com
2. Inicia sesión con tu cuenta Microsoft (o crea una)
3. Ve a **GitHub Student Developer Pack** → **Azure**
4. Activa los **$200 USD de crédito** gratuito
5. Verifica que tu suscripción esté activa

---

## 🤖 Paso 2: Crear recurso de Azure OpenAI

1. En el portal de Azure, busca **"Azure OpenAI"**
2. Click en **"Create"** / **"Crear"**
3. Configura:
   - **Subscription**: Tu suscripción de estudiante
   - **Resource group**: Crea uno nuevo llamado `smart-unibot-rg`
   - **Region**: `East US` o `West Europe` (donde esté disponible GPT-4)
   - **Name**: `smart-unibot-openai`
   - **Pricing tier**: `Standard S0`
4. Click **"Review + create"** → **"Create"**
5. Espera 2-3 minutos a que se despliegue

---

## 🔑 Paso 3: Obtener las credenciales

1. Ve al recurso recién creado
2. En el menú lateral, click en **"Keys and Endpoint"**
3. Copia:
   - **KEY 1** (tu API Key)
   - **Endpoint** (la URL, algo como `https://smart-unibot-openai.openai.azure.com/`)

---

## 📦 Paso 4: Desplegar modelo GPT-4

1. En tu recurso de Azure OpenAI, ve a **"Model deployments"**
2. Click **"Create new deployment"**
3. Configura:
   - **Model**: Selecciona `gpt-4` o `gpt-4-32k` (el que esté disponible)
   - **Deployment name**: `gpt-4` (importante: usa exactamente este nombre)
   - **Model version**: La más reciente
4. Click **"Create"**
5. Espera a que el estado sea **"Succeeded"**

---

## ⚙️ Paso 5: Configurar variables de entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Ve a **Settings** → **Environment Variables**
3. Añade estas 5 variables:

| Variable | Valor | Dónde obtenerlo |
|----------|-------|-----------------|
| `AZURE_OPENAI_ENDPOINT` | `https://smart-unibot-openai.openai.azure.com/` | Keys and Endpoint en Azure |
| `AZURE_OPENAI_API_KEY` | `tu-key-aqui` | KEY 1 en Azure |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-4` | Nombre del deployment que creaste |
| `SUPABASE_URL` | `https://xyz.supabase.co` | Ya la tienes configurada |
| `SUPABASE_ANON_KEY` | `eyJh...` | Ya la tienes configurada |

4. **Importante**: Marca las 3 variables de Azure para todos los entornos:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

5. Click **"Save"**

---

## 🔄 Paso 6: Redesplegar la aplicación

1. Ve a **Deployments** en Vercel
2. Click en el último deployment exitoso
3. Click en **"Redeploy"** (los 3 puntos → Redeploy)
4. Espera a que termine el despliegue

---

## ✅ Paso 7: Probar el chatbot

1. Ve a tu aplicación: `https://proyecto-practico.vercel.app`
2. Inicia sesión
3. Ve a la sección **Chatbot**
4. Prueba con preguntas como:
   - "¿Qué tareas tengo pendientes?"
   - "¿Cuándo es mi próxima clase?"
   - "Dame consejos para organizarme mejor"
   - "¿Qué asignaturas tengo mañana?"

---

## 🐛 Troubleshooting

### Error: "Azure OpenAI credentials not configured"
- Verifica que las variables de entorno estén bien escritas en Vercel
- Asegúrate de haber redesplegado después de añadir las variables

### Error: "Deployment not found"
- Verifica que el nombre del deployment en Azure sea exactamente `gpt-4`
- Si usaste otro nombre, actualiza `AZURE_OPENAI_DEPLOYMENT` en Vercel

### Error: "Rate limit exceeded"
- Azure OpenAI tiene límites por defecto
- Ve a Azure Portal → Quotas para aumentarlos

### El bot responde muy lento
- Normal en la primera petición (cold start)
- Las siguientes serán más rápidas

---

## 💰 Costes estimados

Con tu **$200 de crédito de estudiante**:

- GPT-4: ~$0.03 por 1000 tokens de input, $0.06 por 1000 tokens de output
- Una conversación típica: ~500 tokens = $0.045
- Con $200 puedes hacer: **~4,400 conversaciones completas**
- **Más que suficiente para todo el proyecto universitario** 🎉

---

## 📊 Monitorear uso

1. Ve a Azure Portal → Tu recurso OpenAI
2. Click en **"Metrics"**
3. Puedes ver:
   - Total de llamadas
   - Tokens consumidos
   - Latencia promedio
   - Errores

---

## 🎓 Recursos adicionales

- [Documentación Azure OpenAI](https://learn.microsoft.com/es-es/azure/ai-services/openai/)
- [GitHub Student Pack](https://education.github.com/pack)
- [Pricing Calculator](https://azure.microsoft.com/es-es/pricing/calculator/)

---

¿Problemas? Abre un issue en GitHub o contacta: truujjii@students.uab.cat
