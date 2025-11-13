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

app.http('logout', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Logout function triggered');
        
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
            
            // Conectar a base de datos
            const pool = await sql.connect(config);
            
            // Eliminar sesión
            await pool.request()
                .input('sessionId', sql.NVarChar, sessionId)
                .query('DELETE FROM Sessions WHERE SessionID = @sessionId');
            
            await pool.close();
            
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: 'Sesión cerrada exitosamente'
                }
            };
            
        } catch (error) {
            context.error('Logout error:', error);
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    message: 'Error al cerrar sesión'
                }
            };
        }
    }
});
