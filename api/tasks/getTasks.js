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

app.http('getTasks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'tasks/getTasks',
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
            
            const filter = request.query.get('filter') || 'all';
            
            let query = supabase
                .from('tasks')
                .select('*')
                .eq('userid', userId);
            
            if (filter === 'pending') {
                query = query.eq('iscompleted', false);
            } else if (filter === 'completed') {
                query = query.eq('iscompleted', true);
            }
            
            const { data: tasks, error } = await query.order('duedate');
            
            if (error) throw error;
            
            const formattedTasks = tasks.map(t => ({
                taskId: t.taskid,
                title: t.title,
                description: t.description,
                subject: t.subject,
                dueDate: t.duedate,
                priority: t.priority,
                isCompleted: t.iscompleted,
                completedAt: t.completedat,
                createdAt: t.createdat
            }));
            
            return { status: 200, jsonBody: { success: true, data: formattedTasks } };
        } catch (error) {
            context.error('GetTasks error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al obtener tareas' } };
        }
    }
});
