const { app } = require('@azure/functions');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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

app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Login function triggered');
        
        try {
            const body = await request.json();
            const { email, password } = body;
            
            // Validación
            if (!email || !password) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: 'Email y contraseña son requeridos'
                    }
                };
            }
            
            // Conectar a base de datos
            const pool = await sql.connect(config);
            
            // Buscar usuario
            const userResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT UserID, Email, PasswordHash, FirstName, LastName FROM Users WHERE Email = @email');
            
            if (userResult.recordset.length === 0) {
                await pool.close();
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        message: 'Credenciales inválidas'
                    }
                };
            }
            
            const user = userResult.recordset[0];
            
            // Verificar contraseña
            const passwordValid = await bcrypt.compare(password, user.PasswordHash);
            
            if (!passwordValid) {
                await pool.close();
                return {
                    status: 401,
                    jsonBody: {
                        success: false,
                        message: 'Credenciales inválidas'
                    }
                };
            }
            
            // Generar session ID
            const sessionId = uuidv4();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días
            
            // Crear sesión
            await pool.request()
                .input('sessionId', sql.NVarChar, sessionId)
                .input('userId', sql.Int, user.UserID)
                .input('expiresAt', sql.DateTime, expiresAt)
                .query(`
                    INSERT INTO Sessions (SessionID, UserID, CreatedAt, ExpiresAt)
                    VALUES (@sessionId, @userId, GETDATE(), @expiresAt)
                `);
            
            // Actualizar último login
            await pool.request()
                .input('userId', sql.Int, user.UserID)
                .query('UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @userId');
            
            await pool.close();
            
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    data: {
                        sessionId: sessionId,
                        user: {
                            userId: user.UserID,
                            email: user.Email,
                            firstName: user.FirstName,
                            lastName: user.LastName
                        }
                    },
                    message: 'Login exitoso'
                }
            };
            
        } catch (error) {
            context.error('Login error:', error);
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    message: 'Error al iniciar sesión'
                }
            };
        }
    }
});
