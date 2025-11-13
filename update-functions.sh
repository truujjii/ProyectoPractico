#!/bin/bash

# Script para actualizar todas las funciones Azure a Supabase

echo "🔄 Actualizando todas las Azure Functions para usar Supabase..."

cd "/Users/truujjii/Documents/UAB/Empresa i tecnologia/4t/1r semestre/Tecnologies intel i arc/smart-unibot"

# Backup de archivos antiguos
echo "📦 Haciendo backup de archivos antiguos..."
mkdir -p api/backup
mv api/schedule/*.js api/backup/ 2>/dev/null
mv api/tasks/*.js api/backup/ 2>/dev/null
mv api/chatbot/*.js api/backup/ 2>/dev/null

echo "✅ Archivos antiguos respaldados en api/backup/"
echo "🎉 Listo para crear las nuevas funciones"
