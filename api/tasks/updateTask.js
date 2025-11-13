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

app.http('updateTask', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'tasks/updateTask',
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
            const { taskId, title, description, subject, dueDate, priority, isCompleted } = body;
            
            if (!taskId) {
                return { status: 400, jsonBody: { success: false, message: 'TaskID requerido' } };
            }
            
            // Verificar propiedad
            const { data: existingTask } = await supabase
                .from('tasks')
                .select('taskid')
                .eq('taskid', taskId)
                .eq('userid', userId)
                .single();
            
            if (!existingTask) {
                return { status: 404, jsonBody: { success: false, message: 'Tarea no encontrada' } };
            }
            
            // Construir update
            const updates = {};
            if (title) updates.title = title;
            if (description !== undefined) updates.description = description;
            if (subject !== undefined) updates.subject = subject;
            if (dueDate) updates.duedate = dueDate;
            if (priority) updates.priority = priority;
            
            // Lógica especial para isCompleted
            if (isCompleted !== undefined) {
                updates.iscompleted = isCompleted;
                if (isCompleted) {
                    updates.completedat = new Date().toISOString();
                } else {
                    updates.completedat = null;
                }
            }
            
            const { error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('taskid', taskId)
                .eq('userid', userId);
            
            if (error) throw error;
            
            return { status: 200, jsonBody: { success: true, message: 'Tarea actualizada' } };
        } catch (error) {
            context.error('UpdateTask error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al actualizar tarea' } };
        }
    }
});
