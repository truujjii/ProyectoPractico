const { app } = require('@azure/functions');
const sql = require('mssql');

const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false }
};

async function validateSession(sessionId) {
    const pool = await sql.connect(config);
    const result = await pool.request()
        .input('sessionId', sql.NVarChar, sessionId)
        .query('SELECT UserID FROM Sessions WHERE SessionID = @sessionId AND ExpiresAt > GETDATE()');
    await pool.close();
    return result.recordset.length > 0 ? result.recordset[0] : null;
}

app.http('updateTask', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'tasks/updateTask',
    handler: async (request, context) => {
        try {
            const sessionId = request.headers.get('x-session-id');
            if (!sessionId) {
                return { status: 401, jsonBody: { success: false, message: 'No autenticado' } };
            }
            
            const user = await validateSession(sessionId);
            if (!user) {
                return { status: 401, jsonBody: { success: false, message: 'Sesión inválida' } };
            }
            
            const body = await request.json();
            const { taskId, title, description, subject, dueDate, priority, isCompleted } = body;
            
            if (!taskId) {
                return { status: 400, jsonBody: { success: false, message: 'TaskID requerido' } };
            }
            
            const pool = await sql.connect(config);
            
            // Verificar que la tarea pertenece al usuario
            const checkResult = await pool.request()
                .input('taskId', sql.Int, taskId)
                .input('userId', sql.Int, user.UserID)
                .query('SELECT TaskID FROM Tasks WHERE TaskID = @taskId AND UserID = @userId');
            
            if (checkResult.recordset.length === 0) {
                await pool.close();
                return { status: 404, jsonBody: { success: false, message: 'Tarea no encontrada' } };
            }
            
            // Construir query de actualización
            let updateQuery = 'UPDATE Tasks SET ';
            const updates = [];
            const req = pool.request().input('taskId', sql.Int, taskId).input('userId', sql.Int, user.UserID);
            
            if (title) {
                updates.push('Title = @title');
                req.input('title', sql.NVarChar, title);
            }
            if (description !== undefined) {
                updates.push('Description = @description');
                req.input('description', sql.NVarChar, description);
            }
            if (subject !== undefined) {
                updates.push('Subject = @subject');
                req.input('subject', sql.NVarChar, subject);
            }
            if (dueDate) {
                updates.push('DueDate = @dueDate');
                req.input('dueDate', sql.Date, dueDate);
            }
            if (priority) {
                updates.push('Priority = @priority');
                req.input('priority', sql.NVarChar, priority);
            }
            if (isCompleted !== undefined) {
                updates.push('IsCompleted = @isCompleted');
                req.input('isCompleted', sql.Bit, isCompleted);
                
                if (isCompleted) {
                    updates.push('CompletedAt = GETDATE()');
                } else {
                    updates.push('CompletedAt = NULL');
                }
            }
            
            updateQuery += updates.join(', ') + ' WHERE TaskID = @taskId AND UserID = @userId';
            
            await req.query(updateQuery);
            await pool.close();
            
            return {
                status: 200,
                jsonBody: { success: true, message: 'Tarea actualizada' }
            };
        } catch (error) {
            context.error('UpdateTask error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al actualizar tarea' } };
        }
    }
});
