-- ============================================
-- Confirmar Todos los Usuarios Existentes
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Este script confirma el email de todos los usuarios
-- que aún no lo han confirmado

UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Verificar resultados
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
