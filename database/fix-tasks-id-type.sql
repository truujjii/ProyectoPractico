-- ============================================
-- Cambiar tipo de columna id de UUID a TEXT
-- PostgreSQL (Supabase)
-- ============================================

-- Eliminar la columna id (esto borrará los datos)
ALTER TABLE tasks DROP COLUMN id;

-- Añadir de nuevo como TEXT
ALTER TABLE tasks ADD COLUMN id TEXT PRIMARY KEY;

-- Si quieres preservar datos existentes, usa esto en su lugar:
-- ALTER TABLE tasks ALTER COLUMN id TYPE TEXT USING id::TEXT;
