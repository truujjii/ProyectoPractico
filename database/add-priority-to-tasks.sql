-- ============================================
-- Añadir columna 'priority' a tabla 'tasks'
-- PostgreSQL (Supabase)
-- ============================================

-- Añadir columna priority con valor por defecto 'Media'
ALTER TABLE tasks 
ADD COLUMN priority TEXT DEFAULT 'Media' CHECK (priority IN ('Alta', 'Media', 'Baja'));

-- Actualizar tareas existentes para que tengan prioridad 'Media'
UPDATE tasks SET priority = 'Media' WHERE priority IS NULL;

-- Crear índice para optimizar consultas por prioridad
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
