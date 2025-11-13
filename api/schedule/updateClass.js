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

app.http('updateClass', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'schedule/updateClass',
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
            const { classId, subjectName, dayOfWeek, startTime, endTime, location, professor } = body;
            
            if (!classId) {
                return { status: 400, jsonBody: { success: false, message: 'ClassID requerido' } };
            }
            
            const pool = await sql.connect(config);
            
            // Verificar que la clase pertenece al usuario
            const checkResult = await pool.request()
                .input('classId', sql.Int, classId)
                .input('userId', sql.Int, user.UserID)
                .query('SELECT ClassID FROM Classes WHERE ClassID = @classId AND UserID = @userId');
            
            if (checkResult.recordset.length === 0) {
                await pool.close();
                return { status: 404, jsonBody: { success: false, message: 'Clase no encontrada' } };
            }
            
            // Actualizar
            let updateQuery = 'UPDATE Classes SET ';
            const updates = [];
            const req = pool.request().input('classId', sql.Int, classId).input('userId', sql.Int, user.UserID);
            
            if (subjectName) {
                updates.push('SubjectName = @subjectName');
                req.input('subjectName', sql.NVarChar, subjectName);
            }
            if (dayOfWeek) {
                updates.push('DayOfWeek = @dayOfWeek');
                req.input('dayOfWeek', sql.Int, dayOfWeek);
            }
            if (startTime) {
                updates.push('StartTime = @startTime');
                req.input('startTime', sql.Time, startTime);
            }
            if (endTime) {
                updates.push('EndTime = @endTime');
                req.input('endTime', sql.Time, endTime);
            }
            if (location !== undefined) {
                updates.push('Location = @location');
                req.input('location', sql.NVarChar, location);
            }
            if (professor !== undefined) {
                updates.push('Professor = @professor');
                req.input('professor', sql.NVarChar, professor);
            }
            
            updateQuery += updates.join(', ') + ' WHERE ClassID = @classId AND UserID = @userId';
            
            await req.query(updateQuery);
            await pool.close();
            
            return {
                status: 200,
                jsonBody: { success: true, message: 'Clase actualizada' }
            };
        } catch (error) {
            context.error('UpdateClass error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al actualizar clase' } };
        }
    }
});
