# Configuración de Google Gemini API para Smart UNI-BOT

## ✅ Ventajas de Gemini

- **100% GRATIS** sin tarjeta de crédito
- **15 requests por minuto** (más que suficiente)
- **Sin límite de tiempo** (no caduca)
- **Configuración en 3 minutos**

---

## 🚀 Paso 1: Obtener API Key (2 minutos)

1. Ve a **https://aistudio.google.com/app/apikey**
2. Inicia sesión con tu cuenta Google (puedes usar tu correo de la universidad)
3. Click en **"Get API key"** o **"Crear clave de API"**
4. Click en **"Create API key in new project"** o **"Crear clave de API en un proyecto nuevo"**
5. Espera 5-10 segundos
6. **Copia la API Key** que aparece (algo como: `AIzaSyC...`)

⚠️ **IMPORTANTE**: Guarda esta clave en un lugar seguro. Solo se muestra una vez.

---

## ⚙️ Paso 2: Configurar en Vercel (1 minuto)

1. Ve a tu proyecto en Vercel: https://vercel.com/truujjii/proyecto-practico
2. Click en **"Settings"** (arriba)
3. Click en **"Environment Variables"** (menú lateral)
4. Añade esta variable:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `GEMINI_API_KEY` | Tu clave de API | `AIzaSyC_ejemplo123...` |

5. **Marca los 3 entornos:**
   - ☑️ Production
   - ☑️ Preview  
   - ☑️ Development

6. Click **"Save"**

---

## 🔄 Paso 3: Redesplegar (30 segundos)

1. Ve a **"Deployments"** en Vercel
2. Click en el último deployment exitoso
3. Click en los **3 puntos (···)** → **"Redeploy"**
4. Confirma → Espera 30-60 segundos

---

## ✅ Paso 4: ¡Probar!

1. Ve a tu app: https://proyecto-practico.vercel.app
2. Inicia sesión
3. Ve a **"Chatbot"**
4. Escribe algo como:
   - "¿Qué tareas tengo pendientes?"
   - "¿Cuándo es mi próxima clase?"
   - "Ayúdame a organizarme"

**¡Debería responderte con IA! 🎉**

---

## 📊 Límites (más que suficiente)

- **15 requests/minuto** = 900 requests/hora
- **1500 requests/día** (con Gemini 1.5 Flash)
- **100% GRATIS** permanentemente

Para un proyecto universitario con varios usuarios, estos límites son perfectos.

---

## 🐛 Troubleshooting

### Error: "Gemini API key not configured"
- Verifica que añadiste `GEMINI_API_KEY` en Vercel
- Asegúrate de haber redesplegado después de añadir la variable

### Error: "API key not valid"
- Verifica que copiaste la clave completa (empieza con `AIzaSy`)
- Genera una nueva clave si la perdiste

### El bot no responde / Timeout
- Primera petición puede tardar 3-5 segundos (cold start)
- Las siguientes son más rápidas (1-2 segundos)

### Límite de rate excedido
- Espera 1 minuto y vuelve a intentar
- Normal solo si haces muchas peticiones seguidas

---

## 🔐 Seguridad

✅ **Buenas prácticas:**
- La API Key está solo en variables de entorno de Vercel
- No está en el código fuente
- Solo accesible desde el backend (serverless function)
- Cada usuario solo ve sus propios datos (RLS en Supabase)

❌ **NUNCA:**
- Subas la API Key a Git
- La pongas en el código del frontend
- La compartas públicamente

---

## 📚 Recursos

- [Google AI Studio](https://aistudio.google.com/)
- [Documentación Gemini API](https://ai.google.dev/docs)
- [Pricing y límites](https://ai.google.dev/pricing)

---

¿Problemas? Abre un issue en GitHub o contacta: truujjii@students.uab.cat
