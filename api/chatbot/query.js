const { app } = require('@azure/functions');
const { supabase } = require('../supabaseClient');

async function validateSession(sessionId) {
    const { data: session } = await supabase
        .from('sessions')
        .select('userid')
        .eq('sessionid', sessionId)
        .gt('expiresat', new Date().toISOString())
        .single();
    return session ? session.userid : null;
}

function detectIntent(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('hoy') && (msg.includes('clase') || msg.includes('horario'))) {
        return 'clases_hoy';
    }
    if (msg.includes('mañana') && (msg.includes('clase') || msg.includes('horario'))) {
        return 'clases_manana';
    }
    if (msg.includes('tarea') && (msg.includes('pendiente') || msg.includes('por hacer'))) {
        return 'tareas_pendientes';
    }
    if (msg.includes('próxima tarea') || msg.includes('siguiente tarea')) {
        return 'proxima_tarea';
    }
    if (msg.includes('ayuda') || msg.includes('ayudame')) {
        return 'ayuda';
    }
    
    return 'unknown';
}

function getDayOfWeek() {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const today = new Date().getDay();
    return { today: today, tomorrow: (today + 1) % 7, todayName: days[today] };
}

function formatTime(time) {
    return time.substring(0, 5); // HH:MM:SS -> HH:MM
}

function getDaysUntilDue(dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return 'Atrasada ⚠️';
    if (diff === 0) return 'Hoy ⏰';
    if (diff === 1) return 'Mañana 📅';
    return `En ${diff} días`;
}

app.http('query', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'chatbot/query',
    handler: async (request, context) => {
        try {
            const sessionId = request.headers.get('x-session-id');
            if (!sessionId) {
                return { status: 401, jsonBody: { success: false, message: 'No autenticado' } };
            }
            
            const userId = await validateSession(sessionId);
            if (!userId) {
                return { status: 401, jsonBody: { success: false, message: 'Sesión inválida' } };
            }
            
            const body = await request.json();
            const { message } = body;
            
            if (!message) {
                return { status: 400, jsonBody: { success: false, message: 'Mensaje requerido' } };
            }
            
            const intent = detectIntent(message);
            const days = getDayOfWeek();
            let response = '';
            
            switch (intent) {
                case 'clases_hoy': {
                    const { data: classes } = await supabase
                        .from('classes')
                        .select('*')
                        .eq('userid', userId)
                        .eq('dayofweek', days.today)
                        .order('starttime');
                    
                    if (!classes || classes.length === 0) {
                        response = `📅 No tienes clases hoy (${days.todayName}). ¡Día libre! 🎉`;
                    } else {
                        response = `📅 Tienes ${classes.length} clase(s) hoy (${days.todayName}):\n\n`;
                        classes.forEach(c => {
                            response += `• ${c.subjectname}\n  ${formatTime(c.starttime)} - ${formatTime(c.endtime)}\n`;
                            if (c.location) response += `  📍 ${c.location}\n`;
                            if (c.professor) response += `  👨‍🏫 ${c.professor}\n`;
                            response += '\n';
                        });
                    }
                    break;
                }
                
                case 'clases_manana': {
                    const { data: classes } = await supabase
                        .from('classes')
                        .select('*')
                        .eq('userid', userId)
                        .eq('dayofweek', days.tomorrow)
                        .order('starttime');
                    
                    if (!classes || classes.length === 0) {
                        response = '📅 No tienes clases mañana. ¡Aprovecha el día! 😊';
                    } else {
                        response = `📅 Tienes ${classes.length} clase(s) mañana:\n\n`;
                        classes.forEach(c => {
                            response += `• ${c.subjectname}\n  ${formatTime(c.starttime)} - ${formatTime(c.endtime)}\n`;
                            if (c.location) response += `  📍 ${c.location}\n`;
                            if (c.professor) response += `  👨‍🏫 ${c.professor}\n`;
                            response += '\n';
                        });
                    }
                    break;
                }
                
                case 'tareas_pendientes': {
                    const { data: tasks } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('userid', userId)
                        .eq('iscompleted', false)
                        .order('duedate')
                        .limit(5);
                    
                    if (!tasks || tasks.length === 0) {
                        response = '✅ ¡Genial! No tienes tareas pendientes. 🎉';
                    } else {
                        const { data: allTasks } = await supabase
                            .from('tasks')
                            .select('taskid')
                            .eq('userid', userId)
                            .eq('iscompleted', false);
                        
                        const total = allTasks ? allTasks.length : 0;
                        response = `📝 Tienes ${total} tarea(s) pendiente(s).\n\nPróximas 5:\n\n`;
                        
                        tasks.forEach(t => {
                            response += `• ${t.title}\n`;
                            if (t.subject) response += `  📚 ${t.subject}\n`;
                            response += `  📅 ${getDaysUntilDue(t.duedate)}\n`;
                            if (t.priority === 'Alta') response += `  🔴 Prioridad Alta\n`;
                            response += '\n';
                        });
                    }
                    break;
                }
                
                case 'proxima_tarea': {
                    const { data: task } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('userid', userId)
                        .eq('iscompleted', false)
                        .order('duedate')
                        .limit(1)
                        .single();
                    
                    if (!task) {
                        response = '✅ No tienes tareas pendientes. ¡Buen trabajo! 🎊';
                    } else {
                        response = `📝 Tu próxima tarea es:\n\n`;
                        response += `• ${task.title}\n`;
                        if (task.description) response += `  ${task.description}\n`;
                        if (task.subject) response += `  📚 ${task.subject}\n`;
                        response += `  📅 ${getDaysUntilDue(task.duedate)}\n`;
                        if (task.priority === 'Alta') response += `  🔴 Prioridad Alta\n`;
                    }
                    break;
                }
                
                case 'ayuda': {
                    response = `🤖 ¡Hola! Soy tu asistente Smart UNI-BOT.\n\nPuedo ayudarte con:\n\n`;
                    response += `📅 "¿Qué clases tengo hoy?" - Tu horario de hoy\n`;
                    response += `📅 "¿Qué clases tengo mañana?" - Tu horario de mañana\n`;
                    response += `📝 "¿Cuántas tareas pendientes tengo?" - Lista de tareas\n`;
                    response += `📝 "¿Cuál es mi próxima tarea?" - Siguiente tarea por hacer\n\n`;
                    response += `¡Pregúntame lo que necesites! 😊`;
                    break;
                }
                
                default: {
                    response = `🤔 No entiendo tu pregunta.\n\nIntenta preguntarme:\n`;
                    response += `• "¿Qué clases tengo hoy?"\n`;
                    response += `• "¿Cuántas tareas pendientes tengo?"\n`;
                    response += `• "Ayuda" para ver todas las opciones`;
                }
            }
            
            return {
                status: 200,
                jsonBody: { success: true, data: { response } }
            };
        } catch (error) {
            context.error('Chatbot Query error:', error);
            return {
                status: 500,
                jsonBody: { success: false, message: 'Error en el chatbot' }
            };
        }
    }
});
