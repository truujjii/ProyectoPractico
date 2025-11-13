const { app } = require('@azure/functions');
const sql = require('mssql');
const bcrypt = require('bcryptjs');

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

app.http('register', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Register function triggered');
        
        try {
            const body = await request.json();
            const { email, password, firstName, lastName } = body;
            
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
            
            if (password.length < 8) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: 'La contraseña debe tener al menos 8 caracteres'
                    }
                };
            }
            
            // Conectar a base de datos
            const pool = await sql.connect(config);
            
            // Verificar si el email ya existe
            const checkResult = await pool.request()
                .input('email', sql.NVarChar, email)
                .query('SELECT UserID FROM Users WHERE Email = @email');
            
            if (checkResult.recordset.length > 0) {
                await pool.close();
                return {
                    status: 409,
                    jsonBody: {
                        success: false,
                        message: 'El email ya está registrado'
                    }
                };
            }
            
            // Hash de contraseña
            const passwordHash = await bcrypt.hash(password, 10);
            
            // Insertar usuario
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .input('firstName', sql.NVarChar, firstName || null)
                .input('lastName', sql.NVarChar, lastName || null)
                .query(`
                    INSERT INTO Users (Email, PasswordHash, FirstName, LastName, CreatedAt)
                    OUTPUT INSERTED.UserID, INSERTED.Email
                    VALUES (@email, @passwordHash, @firstName, @lastName, GETDATE())
                `);
            
            await pool.close();
            
            const user = result.recordset[0];
            
            return {
                status: 201,
                jsonBody: {
                    success: true,
                    data: {
                        userId: user.UserID,
                        email: user.Email
                    },
                    message: 'Usuario registrado exitosamente'
                }
            };
            
        } catch (error) {
            context.error('Register error:', error);
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    message: 'Error al registrar usuario'
                }
            };
        }
    }
});
