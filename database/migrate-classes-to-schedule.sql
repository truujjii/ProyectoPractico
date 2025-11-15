-- ============================================
-- Migrar clases existentes de 'classes' a 'schedule'
-- PostgreSQL (Supabase)
-- ============================================

-- Insertar todas las clases de la tabla 'classes' en 'schedule'
-- Solo migra clases que no existan ya en schedule
INSERT INTO schedule (id, user_id, subject_name, day_of_week, start_time, end_time, location, professor, created_at)
SELECT 
    'migrated-' || CAST(id AS TEXT) AS id,  -- Generar ID único basado en el id original
    user_id,                                 -- user_id ya es UUID
    subject_name,
    day_of_week,
    start_time,
    end_time,
    location,
    professor,
    created_at
FROM classes
WHERE NOT EXISTS (
    SELECT 1 FROM schedule 
    WHERE schedule.user_id = classes.user_id
    AND schedule.subject_name = classes.subject_name
    AND schedule.day_of_week = classes.day_of_week
    AND schedule.start_time = classes.start_time
);

-- Verificar resultados
SELECT 
    COUNT(*) as total_migradas,
    'Clases migradas de classes a schedule' as descripcion
FROM schedule
WHERE id LIKE 'migrated-%';
