-- Script para convertir un usuario en Founder
-- Ejecutar en Supabase SQL Editor

-- IMPORTANTE: Reemplaza 'TU_EMAIL_AQUI' con tu email real

UPDATE user_roles
SET role = 'founder'
WHERE user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'TU_EMAIL_AQUI'
);

-- Verificar el cambio
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'TU_EMAIL_AQUI';
