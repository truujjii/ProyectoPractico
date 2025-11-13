/* ============================================
   Smart UNI-BOT - Cliente API
   Funciones para llamadas a Azure Functions
   ============================================ */

const API_BASE_URL = '/api';

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
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            }
        });
        
        if (error) throw error;
        
        return {
            success: true,
            data: { user: data.user },
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
        
        localStorage.setItem('sessionId', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
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
    return await apiFetch('/schedule/getSchedule', {
        method: 'GET'
    });
}

/**
 * Crear nueva clase
 */
async function createClass(classData) {
    return await apiFetch('/schedule/createClass', {
        method: 'POST',
        body: JSON.stringify(classData)
    });
}

/**
 * Actualizar clase existente
 */
async function updateClass(classId, classData) {
    return await apiFetch('/schedule/updateClass', {
        method: 'PUT',
        body: JSON.stringify({ classId, ...classData })
    });
}

/**
 * Eliminar clase
 */
async function deleteClass(classId) {
    return await apiFetch('/schedule/deleteClass', {
        method: 'DELETE',
        body: JSON.stringify({ classId })
    });
}

/**
 * Borrar todo el semestre
 */
async function clearSemester() {
    return await apiFetch('/schedule/clearSemester', {
        method: 'DELETE'
    });
}

// ============================================
// TAREAS
// ============================================

/**
 * Obtener tareas del usuario
 * @param {string} filter - 'all', 'pending', 'completed'
 */
async function getTasks(filter = 'all') {
    return await apiFetch(`/tasks/getTasks?filter=${filter}`, {
        method: 'GET'
    });
}

/**
 * Crear nueva tarea
 */
async function createTask(taskData) {
    return await apiFetch('/tasks/createTask', {
        method: 'POST',
        body: JSON.stringify(taskData)
    });
}

/**
 * Actualizar tarea existente
 */
async function updateTask(taskId, taskData) {
    return await apiFetch('/tasks/updateTask', {
        method: 'PUT',
        body: JSON.stringify({ taskId, ...taskData })
    });
}

/**
 * Eliminar tarea
 */
async function deleteTask(taskId) {
    return await apiFetch('/tasks/deleteTask', {
        method: 'DELETE',
        body: JSON.stringify({ taskId })
    });
}

/**
 * Marcar tarea como completada/pendiente
 */
async function toggleTaskComplete(taskId, isCompleted) {
    return await updateTask(taskId, { 
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null
    });
}

// ============================================
// CHATBOT
// ============================================

/**
 * Enviar consulta al chatbot
 */
async function queryChatbot(message) {
    return await apiFetch('/chatbot/query', {
        method: 'POST',
        body: JSON.stringify({ message })
    });
}
