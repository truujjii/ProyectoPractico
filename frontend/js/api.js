/* ============================================
   Smart UNI-BOT - Cliente API
   Funciones para llamadas a Azure Functions
   ============================================ */

const API_BASE_URL = '/api';

/**
 * Convertir objeto de camelCase a snake_case para Supabase
 */
function toSnakeCase(obj) {
    const result = {};
    for (const key in obj) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = obj[key];
    }
    return result;
}

/**
 * Convertir objeto de snake_case a camelCase desde Supabase
 */
function toCamelCase(obj) {
    const result = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}

/**
 * Helper para hacer peticiones fetch con manejo de errores
 */
async function apiFetch(endpoint, options = {}) {
    const sessionId = localStorage.getItem('sessionId');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(sessionId && { 'X-Session-ID': sessionId })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================

/**
 * Registrar nuevo usuario
 */
async function register(email, password, firstName = '', lastName = '') {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard.html',
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    email_confirmed: true // Auto-confirmar email
                }
            }
        });
        
        if (error) throw error;
        
        // Auto-login después del registro
        if (data.session) {
            // Por defecto los nuevos usuarios son 'user'
            localStorage.setItem('sessionId', data.session.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('userRole', 'user');
        }
        
        return {
            success: true,
            data: { user: data.user, session: data.session },
            message: 'Usuario registrado exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Error al registrar usuario'
        };
    }
}

/**
 * Iniciar sesión
 */
async function login(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Obtener el rol del usuario
        const { data: roleData } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user.id)
            .single();
        
        const userRole = roleData?.role || 'user';
        
        localStorage.setItem('sessionId', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', userRole);
        
        return {
            success: true,
            data: {
                sessionId: data.session.access_token,
                user: data.user
            },
            message: 'Login exitoso'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Error al iniciar sesión'
        };
    }
}

/**
 * Cerrar sesión
 */
async function logout() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

/**
 * Verificar si hay sesión activa
 */
function isAuthenticated() {
    return !!localStorage.getItem('sessionId');
}

/**
 * Obtener datos del usuario actual
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// ============================================
// HORARIOS
// ============================================

/**
 * Obtener todo el horario del usuario
 */
async function getSchedule() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) throw new Error('Usuario no autenticado');
        
        const { data, error } = await supabaseClient
            .from('classes')
            .select('*')
            .eq('user_id', user.id)
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });
        
        if (error) throw error;
        
        return {
            success: true,
            data: { classes: data }
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Crear nueva clase
 */
async function createClass(classData) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) throw new Error('Usuario no autenticado');
        
        // Convertir a snake_case y añadir campos necesarios
        const dbData = {
            user_id: user.id,
            subject_name: classData.subjectName,
            day_of_week: classData.dayOfWeek,
            start_time: classData.startTime,
            end_time: classData.endTime,
            location: classData.location || null,
            professor: classData.professor || null,
            semester_year: new Date().getFullYear(),
            semester_period: new Date().getMonth() < 6 ? 'Primavera' : 'Otoño'
        };
        
        const { data, error } = await supabaseClient
            .from('classes')
            .insert([dbData])
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            data: { class: data },
            message: 'Clase creada exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Actualizar clase existente
 */
async function updateClass(classId, classData) {
    try {
        // Convertir a snake_case
        const dbData = {
            subject_name: classData.subjectName,
            day_of_week: classData.dayOfWeek,
            start_time: classData.startTime,
            end_time: classData.endTime,
            location: classData.location || null,
            professor: classData.professor || null
        };
        
        const { data, error } = await supabaseClient
            .from('classes')
            .update(dbData)
            .eq('id', classId)
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            data: { class: data },
            message: 'Clase actualizada exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Eliminar clase
 */
async function deleteClass(classId) {
    try {
        const { error } = await supabaseClient
            .from('classes')
            .delete()
            .eq('id', classId);
        
        if (error) throw error;
        
        return {
            success: true,
            message: 'Clase eliminada exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Borrar todo el semestre
 */
async function clearSemester() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) throw new Error('Usuario no autenticado');
        
        const { error } = await supabaseClient
            .from('classes')
            .delete()
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        return {
            success: true,
            message: 'Semestre borrado exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

// ============================================
// TAREAS
// ============================================

/**
 * Obtener tareas del usuario
 * @param {string} filter - 'all', 'pending', 'completed'
 */
async function getTasks(filter = 'all') {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) throw new Error('Usuario no autenticado');
        
        let query = supabaseClient
            .from('tasks')
            .select('*')
            .eq('user_id', user.id);
        
        if (filter === 'pending') {
            query = query.eq('completed', false);
        } else if (filter === 'completed') {
            query = query.eq('completed', true);
        }
        
        query = query.order('due_date', { ascending: true });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return {
            success: true,
            data: { tasks: data }
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Crear nueva tarea
 */
async function createTask(taskData) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) throw new Error('Usuario no autenticado');
        
        // Convertir a snake_case
        const dbData = {
            user_id: user.id,
            title: taskData.title,
            description: taskData.description || null,
            subject: taskData.subject || null,
            due_date: taskData.dueDate,
            priority: taskData.priority || 'Media',
            is_completed: false
        };
        
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([dbData])
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            data: { task: data },
            message: 'Tarea creada exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Actualizar tarea existente
 */
async function updateTask(taskId, taskData) {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .update(taskData)
            .eq('id', taskId)
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            success: true,
            data: { task: data },
            message: 'Tarea actualizada exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Eliminar tarea
 */
async function deleteTask(taskId) {
    try {
        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        return {
            success: true,
            message: 'Tarea eliminada exitosamente'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Marcar tarea como completada/pendiente
 */
async function toggleTaskComplete(taskId, isCompleted) {
    return await updateTask(taskId, { 
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
    });
}

// ============================================
// CHATBOT
// ============================================

/**
 * Enviar consulta al chatbot
 */
async function queryChatbot(message) {
    // Por ahora retornamos un mensaje simple ya que no tenemos el backend
    return {
        success: true,
        data: {
            response: 'Lo siento, el chatbot aún no está disponible en esta versión. Estamos trabajando en ello.'
        }
    };
}
