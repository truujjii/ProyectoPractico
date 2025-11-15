-- ============================================
-- Crear tabla 'tasks' para Google Sheets sync
-- PostgreSQL (Supabase)
-- ============================================

-- Tabla de tareas (tasks) - Compatible con Google Sheets sync
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,  -- ID de Google Sheets (ej: "test-task-1")
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, is_completed);

-- Habilitar Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias tareas
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias tareas
CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias tareas
CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias tareas
CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar completed_at cuando se marca como completada
CREATE OR REPLACE FUNCTION update_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    ELSIF NEW.is_completed = FALSE THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completed_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_completed_at();

-- Comentarios para documentación
COMMENT ON TABLE tasks IS 'Tareas sincronizadas desde Google Sheets';
COMMENT ON COLUMN tasks.id IS 'ID único de Google Sheets';
COMMENT ON COLUMN tasks.is_completed IS 'Indica si la tarea está completada';
