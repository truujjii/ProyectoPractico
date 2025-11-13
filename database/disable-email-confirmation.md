# Configuración: Desactivar Confirmación de Email en Supabase

Para permitir que los usuarios se registren y accedan inmediatamente sin confirmación de email:

## Opción 1: Configuración por UI (RECOMENDADO)

1. Ve a tu proyecto de Supabase: https://app.supabase.com/project/fvfzscnycdzmxxsrgiyd
2. Ve a **Authentication** > **Settings** (en el menú lateral)
3. Busca la sección **Email Auth**
4. Desactiva la opción **"Enable email confirmations"**
5. Guarda los cambios

## Opción 2: Configuración Manual por SQL

Si prefieres hacerlo por SQL, ejecuta esto en el SQL Editor de Supabase:

```sql
-- Desactivar confirmación de email para nuevos usuarios
-- NOTA: Esta configuración se hace mejor desde la UI de Supabase

-- Para confirmar usuarios existentes que no han confirmado su email:
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## Verificación

Después de hacer estos cambios:

1. Intenta crear un nuevo usuario desde la aplicación
2. El usuario debería ser redirigido automáticamente al dashboard
3. No debería recibir ningún email de confirmación
4. Debería poder acceder inmediatamente a todas las funcionalidades

## Notas Importantes

- Con esta configuración, cualquier persona puede registrarse y acceder inmediatamente
- Como admin, podrás gestionar usuarios desde el panel de administración
- Podrás eliminar usuarios no deseados desde `admin-users.html`
- Los usuarios sin email confirmado aparecerán con estado "⚠️ Sin confirmar" en el panel de admin
- Puedes confirmar usuarios manualmente usando el botón ✅ en el panel de admin
