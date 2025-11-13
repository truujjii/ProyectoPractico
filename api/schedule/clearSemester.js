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

app.http('clearSemester', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'schedule/clearSemester',
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
            
            const { data, error } = await supabase
                .from('classes')
                .delete()
                .eq('userid', userId)
                .select();
            
            if (error) throw error;
            
            return {
                status: 200,
                jsonBody: {
                    success: true,
                    data: { deletedCount: data.length },
                    message: 'Horario completo borrado'
                }
            };
        } catch (error) {
            context.error('ClearSemester error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al borrar horario' } };
        }
    }
});
