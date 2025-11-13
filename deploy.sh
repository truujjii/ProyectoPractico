#!/bin/bash

# Script de despliegue automatizado para Smart UNI-BOT
# Este script te ayuda a subir el código a GitHub paso a paso

echo "🚀 Smart UNI-BOT - Script de Despliegue"
echo "========================================"
echo ""

# Colores para el output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para preguntar al usuario
ask_question() {
    echo -e "${YELLOW}$1${NC}"
    read -p "> " answer
    echo "$answer"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encuentra package.json${NC}"
    echo "Por favor, ejecuta este script desde la raíz del proyecto smart-unibot"
    exit 1
fi

echo "✅ Directorio verificado"
echo ""

# Paso 1: Verificar Git
echo "📋 PASO 1: Verificar configuración de Git"
echo "----------------------------------------"

if [ ! -d ".git" ]; then
    echo -e "${RED}❌ No se encontró repositorio Git${NC}"
    echo "Inicializando..."
    git init
    git add .
    git commit -m "Initial commit - Smart UNI-BOT completo y funcional"
    echo -e "${GREEN}✅ Repositorio Git inicializado${NC}"
else
    echo -e "${GREEN}✅ Repositorio Git ya existe${NC}"
fi
echo ""

# Paso 2: Obtener información del usuario
echo "📋 PASO 2: Configuración de GitHub"
echo "-----------------------------------"
echo ""
echo "Antes de continuar, necesitas crear un repositorio en GitHub:"
echo ""
echo "1. Ve a: https://github.com/new"
echo "2. Nombre del repositorio: smart-unibot (o el que prefieras)"
echo "3. Visibilidad: Público (recomendado para Azure)"
echo "4. NO marques ninguna opción de inicializar"
echo "5. Click en 'Create repository'"
echo ""
read -p "¿Ya has creado el repositorio en GitHub? (s/n): " repo_created

if [ "$repo_created" != "s" ] && [ "$repo_created" != "S" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Por favor, crea el repositorio primero y vuelve a ejecutar este script${NC}"
    echo ""
    echo "Recuerda:"
    echo "  - Ve a https://github.com/new"
    echo "  - Crea el repositorio 'smart-unibot'"
    echo "  - Vuelve aquí y ejecuta: bash deploy.sh"
    exit 0
fi

echo ""
github_user=$(ask_question "¿Cuál es tu usuario de GitHub?")
repo_name=$(ask_question "¿Cuál es el nombre de tu repositorio? (por defecto: smart-unibot)")

if [ -z "$repo_name" ]; then
    repo_name="smart-unibot"
fi

echo ""
echo -e "${GREEN}✅ Configuración recibida:${NC}"
echo "   Usuario: $github_user"
echo "   Repositorio: $repo_name"
echo ""

# Paso 3: Configurar remote
echo "📋 PASO 3: Conectar con GitHub"
echo "-------------------------------"

# Eliminar remote existente si hay
git remote remove origin 2>/dev/null

# Añadir nuevo remote
git remote add origin "https://github.com/$github_user/$repo_name.git"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Remote configurado correctamente${NC}"
else
    echo -e "${RED}❌ Error al configurar remote${NC}"
    exit 1
fi

# Verificar que tenemos commits
if ! git log >/dev/null 2>&1; then
    echo "Creando commit inicial..."
    git add .
    git commit -m "Initial commit - Smart UNI-BOT completo y funcional"
fi

echo ""

# Paso 4: Push a GitHub
echo "📋 PASO 4: Subir código a GitHub"
echo "---------------------------------"
echo ""
echo -e "${YELLOW}Nota: GitHub te pedirá autenticación.${NC}"
echo "Si usas HTTPS, necesitarás un Personal Access Token:"
echo "  1. Ve a GitHub → Settings → Developer settings"
echo "  2. Personal access tokens → Tokens (classic)"
echo "  3. Generate new token → Marca 'repo'"
echo "  4. Copia el token"
echo "  5. Úsalo como contraseña cuando Git te lo pida"
echo ""
read -p "Presiona Enter cuando estés listo para continuar..."

git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ¡Código subido exitosamente a GitHub!${NC}"
    echo ""
    echo "Tu repositorio está en:"
    echo "  https://github.com/$github_user/$repo_name"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al subir el código${NC}"
    echo ""
    echo "Posibles soluciones:"
    echo "  1. Verifica que el repositorio existe en GitHub"
    echo "  2. Verifica tu autenticación (usa Personal Access Token)"
    echo "  3. Intenta manualmente:"
    echo "     git push -u origin main"
    exit 1
fi

# Paso 5: Siguiente paso
echo "📋 PRÓXIMOS PASOS"
echo "-----------------"
echo ""
echo "1. ✅ Código en GitHub - COMPLETADO"
echo ""
echo "2. 📊 Crear Azure SQL Database:"
echo "   - Ve a: https://portal.azure.com"
echo "   - Busca 'SQL databases' → Create"
echo "   - Sigue las instrucciones en: DESPLIEGUE_PASO_A_PASO.md"
echo ""
echo "3. 🌐 Crear Azure Static Web App:"
echo "   - En Azure Portal, busca 'Static Web Apps'"
echo "   - Conecta con tu repositorio de GitHub"
echo "   - Detalles en: DESPLIEGUE_PASO_A_PASO.md"
echo ""
echo "📖 Para instrucciones detalladas, abre:"
echo "   DESPLIEGUE_PASO_A_PASO.md"
echo ""
echo -e "${GREEN}¡Buena suerte con el despliegue! 🚀${NC}"
