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

app.http('getTasks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'tasks/getTasks',
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
            
            // Obtener parámetro de filtro (all, pending, completed)
            const filter = request.query.get('filter') || 'all';
            
            const pool = await sql.connect(config);
            
            let whereClause = 'WHERE UserID = @userId';
            if (filter === 'pending') {
                whereClause += ' AND IsCompleted = 0';
            } else if (filter === 'completed') {
                whereClause += ' AND IsCompleted = 1';
            }
            
            const result = await pool.request()
                .input('userId', sql.Int, user.UserID)
                .query(`
                    SELECT 
                        TaskID as taskId,
                        Title as title,
                        Description as description,
                        Subject as subject,
                        DueDate as dueDate,
                        Priority as priority,
                        IsCompleted as isCompleted,
                        CompletedAt as completedAt,
                        CreatedAt as createdAt
                    FROM Tasks
                    ${whereClause}
                    ORDER BY DueDate ASC, Priority DESC
                `);
            
            await pool.close();
            
            return {
                status: 200,
                jsonBody: { success: true, data: result.recordset }
            };
        } catch (error) {
            context.error('GetTasks error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al obtener tareas' } };
        }
    }
});
