-- ============================================
-- Smart UNI-BOT Database Schema - FIXED
-- PostgreSQL (Supabase) con snake_case
-- ============================================

-- Eliminar tablas antiguas si existen
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- Tabla de Clases/Horarios (con snake_case)
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_name VARCHAR(200) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    professor VARCHAR(100),
    semester_year INTEGER NOT NULL,
    semester_period VARCHAR(20) NOT NULL CHECK (semester_period IN ('Otoño', 'Primavera')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_user_day ON classes(user_id, day_of_week);
CREATE INDEX idx_classes_user_semester ON classes(user_id, semester_year, semester_period);

-- Tabla de Tareas (con snake_case)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    subject VARCHAR(200),
    due_date DATE NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('Alta', 'Media', 'Baja')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, is_completed);

-- Habilitar Row Level Security (RLS)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para classes
CREATE POLICY "Users can view their own classes"
    ON classes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classes"
    ON classes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes"
    ON classes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes"
    ON classes FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas de seguridad para tasks
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON tasks FOR DELETE
    USING (auth.uid() = user_id);
