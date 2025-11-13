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

app.http('createTask', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'tasks/createTask',
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
            const { title, description, subject, dueDate, priority } = body;
            
            if (!title || !dueDate) {
                return { status: 400, jsonBody: { success: false, message: 'Título y fecha requeridos' } };
            }
            
            const { data: newTask, error } = await supabase
                .from('tasks')
                .insert([{
                    userid: userId,
                    title: title,
                    description: description || null,
                    subject: subject || null,
                    duedate: dueDate,
                    priority: priority || 'Media',
                    iscompleted: false
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return {
                status: 201,
                jsonBody: { success: true, data: { taskId: newTask.taskid }, message: 'Tarea creada' }
            };
        } catch (error) {
            context.error('CreateTask error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al crear tarea' } };
        }
    }
});
