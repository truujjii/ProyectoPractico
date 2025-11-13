const { app } = require('@azure/functions');
const { supabase } = require('../supabaseClient');
const bcrypt = require('bcryptjs');

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
            
            // Verificar si el usuario ya existe
            const { data: existingUser } = await supabase
                .from('Users')
                .select('*')
                .eq('Email', email)
                .single();
            
            if (existingUser) {
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
            const { data: newUser, error } = await supabase
                .from('Users')
                .insert([{
                    Email: email,
                    PasswordHash: passwordHash,
                    FirstName: firstName || null,
                    LastName: lastName || null
                }])
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
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
