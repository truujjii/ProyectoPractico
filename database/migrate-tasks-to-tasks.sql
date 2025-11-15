-- ============================================
-- Migrar tareas existentes de 'Tasks' a 'tasks'
-- PostgreSQL (Supabase)
-- ============================================

-- Insertar todas las tareas de la tabla 'Tasks' (si existe) en 'tasks'
-- Solo migra tareas que no existan ya en tasks
INSERT INTO tasks (id, user_id, title, subject, due_date, is_completed, created_at, completed_at)
SELECT 
    'migrated-' || CAST(taskid AS TEXT) AS id,  -- Generar ID único basado en el TaskID original
    CAST(userid AS UUID) AS user_id,             -- Convertir UserID a UUID
    title,
    relatedsubject AS subject,                   -- Mapear RelatedSubject a subject
    duedate AS due_date,
    iscompleted AS is_completed,
    createdat AS created_at,
    completedat AS completed_at
FROM Tasks
WHERE NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.user_id = CAST(Tasks.userid AS UUID)
    AND tasks.title = Tasks.title
    AND tasks.due_date = Tasks.duedate
);

-- Verificar resultados
SELECT 
    COUNT(*) as total_migradas,
    'Tareas migradas de Tasks a tasks' as descripcion
FROM tasks
WHERE id LIKE 'migrated-%';
