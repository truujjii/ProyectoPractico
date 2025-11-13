-- ============================================
-- Agregar Sistema de Roles a los Usuarios
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Política: Los usuarios pueden ver su propio rol
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Política: Solo admins pueden ver todos los roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 5. Política: Solo admins pueden insertar/actualizar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 6. Crear función para auto-asignar rol 'user' a nuevos registros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear trigger para ejecutar la función automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Asignar rol 'admin' al usuario admin existente
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@smartunibot.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 9. Asignar rol 'user' a todos los demás usuarios existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE email != 'admin@smartunibot.com'
ON CONFLICT (user_id) DO NOTHING;

-- 10. Verificar roles asignados
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;
