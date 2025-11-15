-- ============================================
-- Arreglar tabla tasks: cambiar id a TEXT
-- Paso a paso para evitar errores
-- ============================================

-- Paso 1: Ver qué tareas existen
SELECT id, title, user_id FROM tasks;

-- Paso 2: Eliminar tareas sin ID o con ID NULL
DELETE FROM tasks WHERE id IS NULL;

-- Paso 3: Cambiar el tipo de id a TEXT
ALTER TABLE tasks ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Paso 4: Verificar que funcionó
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'id';
