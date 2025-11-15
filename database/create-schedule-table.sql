-- ============================================
-- Crear tabla 'schedule' para Google Sheets sync
-- PostgreSQL (Supabase)
-- ============================================

-- Tabla de horarios (schedule) - Compatible con Google Sheets sync
CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY,  -- ID de Google Sheets (ej: "test-class-1")
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    professor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_schedule_user_id ON schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_user_day ON schedule(user_id, day_of_week);

-- Habilitar Row Level Security (RLS)
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias clases
CREATE POLICY "Users can view their own schedule"
    ON schedule FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias clases
CREATE POLICY "Users can insert their own schedule"
    ON schedule FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias clases
CREATE POLICY "Users can update their own schedule"
    ON schedule FOR UPDATE
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias clases
CREATE POLICY "Users can delete their own schedule"
    ON schedule FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedule_updated_at
    BEFORE UPDATE ON schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE schedule IS 'Horario de clases sincronizado desde Google Sheets';
COMMENT ON COLUMN schedule.id IS 'ID único de Google Sheets';
COMMENT ON COLUMN schedule.day_of_week IS '1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo';
