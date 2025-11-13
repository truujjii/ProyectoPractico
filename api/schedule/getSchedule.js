const { app } = require('@azure/functions');
const sql = require('mssql');

// Configuración de SQL Server
const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Helper para verificar sesión
async function validateSession(sessionId) {
    const pool = await sql.connect(config);
    
    const result = await pool.request()
        .input('sessionId', sql.NVarChar, sessionId)
        .query(`
            SELECT s.UserID, u.Email, u.FirstName, u.LastName
            FROM Sessions s
            INNER JOIN Users u ON s.UserID = u.UserID
            WHERE s.SessionID = @sessionId AND s.ExpiresAt > GETDATE()
        `);
    
    await pool.close();
    
    return result.recordset.length > 0 ? result.recordset[0] : null;
}

app.http('getSchedule', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'schedule/getSchedule',
    handler: async (request, context) => {
        context.log('GetSchedule function triggered');
        
        try {
            const sessionId = request.headers.get('x-session-id');
            
            if (!sessionId) {
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        message: 'No autenticado'
                    }
                };
            }
            
            // Validar sesión
            const user = await validateSession(sessionId);
            
            if (!user) {
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        message: 'Sesión inválida o expirada'
                    }
                };
            }
            
            // Obtener horario del usuario
            const pool = await sql.connect(config);
            
            const result = await pool.request()
                .input('userId', sql.Int, user.UserID)
                .query(`
                    SELECT 
                        ClassID as classId,
                        SubjectName as subjectName,
                        DayOfWeek as dayOfWeek,
                        FORMAT(StartTime, 'HH:mm') as startTime,
                        FORMAT(EndTime, 'HH:mm') as endTime,
                        Location as location,
                        Professor as professor,
                        SemesterYear as semesterYear,
                        SemesterPeriod as semesterPeriod
                    FROM Classes
                    WHERE UserID = @userId
                    ORDER BY DayOfWeek, StartTime
                `);
            
            await pool.close();
            
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    data: result.recordset
                }
            };
            
        } catch (error) {
            context.error('GetSchedule error:', error);
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    message: 'Error al obtener horario'
                }
            };
        }
    }
});
