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

app.http('createTask', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'tasks/createTask',
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
            const { title, description, subject, dueDate, priority } = body;
            
            if (!title || !dueDate) {
                return { status: 400, jsonBody: { success: false, message: 'Título y fecha requeridos' } };
            }
            
            const pool = await sql.connect(config);
            
            const result = await pool.request()
                .input('userId', sql.Int, user.UserID)
                .input('title', sql.NVarChar, title)
                .input('description', sql.NVarChar, description || null)
                .input('subject', sql.NVarChar, subject || null)
                .input('dueDate', sql.Date, dueDate)
                .input('priority', sql.NVarChar, priority || 'Media')
                .query(`
                    INSERT INTO Tasks (UserID, Title, Description, Subject, DueDate, Priority)
                    OUTPUT INSERTED.TaskID
                    VALUES (@userId, @title, @description, @subject, @dueDate, @priority)
                `);
            
            await pool.close();
            
            return {
                status: 201,
                jsonBody: { 
                    success: true, 
                    data: { taskId: result.recordset[0].TaskID },
                    message: 'Tarea creada' 
                }
            };
        } catch (error) {
            context.error('CreateTask error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al crear tarea' } };
        }
    }
});
