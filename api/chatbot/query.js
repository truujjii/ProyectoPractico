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

// Función para detectar intención y generar respuesta
function detectIntent(message, scheduleData, tasksData) {
    const msg = message.toLowerCase();
    
    // Saludos
    if (msg.match(/hola|buenos|hey|hi/)) {
        return '¡Hola! 👋 Soy tu asistente académico. Puedo ayudarte con:\n\n' +
               '📅 "¿Qué clases tengo hoy?"\n' +
               '📝 "¿Cuántas tareas tengo pendientes?"\n' +
               '⏰ "¿Cuál es mi próxima tarea?"\n' +
               '📚 "¿Qué tengo mañana?"';
    }
    
    // Clases de hoy
    if (msg.match(/clases? (de )?hoy|horario (de )?hoy|tengo hoy/)) {
        const today = new Date().getDay();
        const todayClasses = scheduleData.filter(c => c.dayOfWeek === today);
        
        if (todayClasses.length === 0) {
            return '🎉 ¡No tienes clases hoy! Aprovecha para descansar o ponerte al día con tareas.';
        }
        
        let response = `📅 Hoy tienes ${todayClasses.length} clase(s):\n\n`;
        todayClasses.forEach(c => {
            response += `🎓 ${c.subjectName}\n`;
            response += `   ⏰ ${c.startTime} - ${c.endTime}\n`;
            if (c.location) response += `   📍 ${c.location}\n`;
            if (c.professor) response += `   👨‍🏫 ${c.professor}\n`;
            response += '\n';
        });
        
        return response.trim();
    }
    
    // Clases de mañana
    if (msg.match(/clases? (de )?mañana|horario (de )?mañana|tengo mañana/)) {
        const tomorrow = (new Date().getDay() + 1) % 7;
        const tomorrowClasses = scheduleData.filter(c => c.dayOfWeek === tomorrow);
        
        if (tomorrowClasses.length === 0) {
            return '🎉 Mañana no tienes clases programadas.';
        }
        
        let response = `📅 Mañana tienes ${tomorrowClasses.length} clase(s):\n\n`;
        tomorrowClasses.forEach(c => {
            response += `🎓 ${c.subjectName}\n`;
            response += `   ⏰ ${c.startTime} - ${c.endTime}\n`;
            if (c.location) response += `   📍 ${c.location}\n`;
            response += '\n';
        });
        
        return response.trim();
    }
    
    // Tareas pendientes
    if (msg.match(/tareas? pendientes?|cuántas tareas?|tengo que hacer/)) {
        const pendingTasks = tasksData.filter(t => !t.isCompleted);
        
        if (pendingTasks.length === 0) {
            return '🎉 ¡Genial! No tienes tareas pendientes. Estás al día.';
        }
        
        let response = `📝 Tienes ${pendingTasks.length} tarea(s) pendiente(s):\n\n`;
        pendingTasks.slice(0, 5).forEach(t => {
            const dueDate = new Date(t.dueDate);
            const today = new Date();
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            let urgency = '';
            if (daysLeft < 0) urgency = '🔴 ¡Atrasada!';
            else if (daysLeft === 0) urgency = '🔴 ¡Hoy!';
            else if (daysLeft === 1) urgency = '🟠 Mañana';
            else if (daysLeft <= 3) urgency = `🟡 En ${daysLeft} días`;
            else urgency = `🟢 En ${daysLeft} días`;
            
            response += `${t.priority === 'Alta' ? '⚠️ ' : ''}${t.title}\n`;
            response += `   ${urgency}\n`;
            if (t.subject) response += `   📚 ${t.subject}\n`;
            response += '\n';
        });
        
        if (pendingTasks.length > 5) {
            response += `\n...y ${pendingTasks.length - 5} más.`;
        }
        
        return response.trim();
    }
    
    // Próxima tarea
    if (msg.match(/próxima tarea|siguiente tarea|qué sigue/)) {
        const pendingTasks = tasksData
            .filter(t => !t.isCompleted)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        if (pendingTasks.length === 0) {
            return '✅ No tienes tareas pendientes próximas.';
        }
        
        const nextTask = pendingTasks[0];
        const dueDate = new Date(nextTask.dueDate);
        const today = new Date();
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let response = '⏰ Tu próxima tarea es:\n\n';
        response += `📌 ${nextTask.title}\n`;
        if (nextTask.description) response += `   📄 ${nextTask.description}\n`;
        if (nextTask.subject) response += `   📚 ${nextTask.subject}\n`;
        response += `   📅 Fecha: ${dueDate.toLocaleDateString('es-ES')}\n`;
        
        if (daysLeft < 0) response += '   🔴 ¡Está atrasada!\n';
        else if (daysLeft === 0) response += '   🔴 ¡Vence hoy!\n';
        else if (daysLeft === 1) response += '   🟠 Vence mañana\n';
        else response += `   🟢 Faltan ${daysLeft} días\n`;
        
        return response.trim();
    }
    
    // Ayuda
    if (msg.match(/ayuda|help|qué puedes hacer|comandos/)) {
        return '🤖 Puedo ayudarte con:\n\n' +
               '📅 Consultar tu horario de hoy o mañana\n' +
               '📝 Ver tus tareas pendientes\n' +
               '⏰ Saber cuál es tu próxima tarea\n' +
               '📊 Obtener estadísticas de tu progreso\n\n' +
               'Solo pregúntame en lenguaje natural, como:\n' +
               '• "¿Qué clases tengo hoy?"\n' +
               '• "¿Cuántas tareas pendientes tengo?"\n' +
               '• "¿Cuál es mi próxima tarea?"';
    }
    
    // Respuesta por defecto
    return 'Hmm, no estoy seguro de entender. 🤔\n\n' +
           'Prueba preguntarme sobre:\n' +
           '• Tu horario de hoy o mañana\n' +
           '• Tus tareas pendientes\n' +
           '• Tu próxima tarea\n\n' +
           'O escribe "ayuda" para ver qué puedo hacer.';
}

app.http('chatbotQuery', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'chatbot/query',
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
            const { message } = body;
            
            if (!message) {
                return { status: 400, jsonBody: { success: false, message: 'Mensaje requerido' } };
            }
            
            const pool = await sql.connect(config);
            
            // Obtener horario del usuario
            const scheduleResult = await pool.request()
                .input('userId', sql.Int, user.UserID)
                .query('SELECT * FROM Classes WHERE UserID = @userId ORDER BY DayOfWeek, StartTime');
            
            // Obtener tareas del usuario
            const tasksResult = await pool.request()
                .input('userId', sql.Int, user.UserID)
                .query('SELECT * FROM Tasks WHERE UserID = @userId ORDER BY DueDate');
            
            await pool.close();
            
            // Generar respuesta basada en el mensaje
            const response = detectIntent(message, scheduleResult.recordset, tasksResult.recordset);
            
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    data: { response }
                }
            };
            
        } catch (error) {
            context.error('ChatbotQuery error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error en el chatbot' } };
        }
    }
});
