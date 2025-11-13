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

app.http('createClass', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'schedule/createClass',
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
            const { subjectName, dayOfWeek, startTime, endTime, location, professor, semesterYear, semesterPeriod } = body;
            
            if (!subjectName || !dayOfWeek || !startTime || !endTime) {
                return { status: 400, jsonBody: { success: false, message: 'Datos incompletos' } };
            }
            
            const pool = await sql.connect(config);
            const result = await pool.request()
                .input('userId', sql.Int, user.UserID)
                .input('subjectName', sql.NVarChar, subjectName)
                .input('dayOfWeek', sql.Int, dayOfWeek)
                .input('startTime', sql.Time, startTime)
                .input('endTime', sql.Time, endTime)
                .input('location', sql.NVarChar, location || null)
                .input('professor', sql.NVarChar, professor || null)
                .input('semesterYear', sql.Int, semesterYear || new Date().getFullYear())
                .input('semesterPeriod', sql.NVarChar, semesterPeriod || 'Otoño')
                .query(`
                    INSERT INTO Classes (UserID, SubjectName, DayOfWeek, StartTime, EndTime, Location, Professor, SemesterYear, SemesterPeriod)
                    OUTPUT INSERTED.ClassID
                    VALUES (@userId, @subjectName, @dayOfWeek, @startTime, @endTime, @location, @professor, @semesterYear, @semesterPeriod)
                `);
            
            await pool.close();
            
            return {
                status: 201,
                jsonBody: { success: true, data: { classId: result.recordset[0].ClassID }, message: 'Clase creada' }
            };
        } catch (error) {
            context.error('CreateClass error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al crear clase' } };
        }
    }
});
