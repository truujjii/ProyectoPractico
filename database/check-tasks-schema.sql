-- Verificar el esquema real de la tabla tasks
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'tasks'
ORDER BY 
    ordinal_position;
