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

app.http('updateClass', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'schedule/updateClass',
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
            const { classId, subjectName, dayOfWeek, startTime, endTime, location, professor } = body;
            
            if (!classId) {
                return { status: 400, jsonBody: { success: false, message: 'ClassID requerido' } };
            }
            
            // Verificar propiedad
            const { data: existingClass } = await supabase
                .from('classes')
                .select('classid')
                .eq('classid', classId)
                .eq('userid', userId)
                .single();
            
            if (!existingClass) {
                return { status: 404, jsonBody: { success: false, message: 'Clase no encontrada' } };
            }
            
            // Construir update
            const updates = {};
            if (subjectName) updates.subjectname = subjectName;
            if (dayOfWeek !== undefined) updates.dayofweek = dayOfWeek;
            if (startTime) updates.starttime = startTime;
            if (endTime) updates.endtime = endTime;
            if (location !== undefined) updates.location = location;
            if (professor !== undefined) updates.professor = professor;
            
            const { error } = await supabase
                .from('classes')
                .update(updates)
                .eq('classid', classId)
                .eq('userid', userId);
            
            if (error) throw error;
            
            return { status: 200, jsonBody: { success: true, message: 'Clase actualizada' } };
        } catch (error) {
            context.error('UpdateClass error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al actualizar clase' } };
        }
    }
});
