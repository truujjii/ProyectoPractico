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

app.http('deleteClass', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'schedule/deleteClass',
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
            const { classId } = body;
            
            if (!classId) {
                return { status: 400, jsonBody: { success: false, message: 'ClassID requerido' } };
            }
            
            const pool = await sql.connect(config);
            
            const result = await pool.request()
                .input('classId', sql.Int, classId)
                .input('userId', sql.Int, user.UserID)
                .query('DELETE FROM Classes WHERE ClassID = @classId AND UserID = @userId');
            
            await pool.close();
            
            if (result.rowsAffected[0] === 0) {
                return { status: 404, jsonBody: { success: false, message: 'Clase no encontrada' } };
            }
            
            return {
                status: 200,
                jsonBody: { success: true, message: 'Clase eliminada' }
            };
        } catch (error) {
            context.error('DeleteClass error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al eliminar clase' } };
        }
    }
});
