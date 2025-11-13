const { app } = require('@azure/functions');
const { supabase } = require('../supabaseClient');

// Helper para verificar sesión
async function validateSession(sessionId) {
    const { data: session } = await supabase
        .from('sessions')
        .select(`
            userid,
            users (userid, email, firstname, lastname)
        `)
        .eq('sessionid', sessionId)
        .gt('expiresat', new Date().toISOString())
        .single();
    
    return session ? session.users : null;
}

app.http('getSchedule', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'schedule/getSchedule',
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
            
            const { data: classes, error } = await supabase
                .from('classes')
                .select('*')
                .eq('userid', user.userid)
                .order('dayofweek')
                .order('starttime');
            
            if (error) throw error;
            
            // Formatear respuesta
            const formattedClasses = classes.map(c => ({
                classId: c.classid,
                subjectName: c.subjectname,
                dayOfWeek: c.dayofweek,
                startTime: c.starttime,
                endTime: c.endtime,
                location: c.location,
                professor: c.professor,
                semesterYear: c.semesteryear,
                semesterPeriod: c.semesterperiod
            }));
            
            return {
                status: 200,
                jsonBody: { success: true, data: formattedClasses }
            };
            
        } catch (error) {
            context.error('GetSchedule error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al obtener horario' } };
        }
    }
});
