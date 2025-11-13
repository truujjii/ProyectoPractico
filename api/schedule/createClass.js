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

app.http('createClass', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'schedule/createClass',
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
            const { subjectName, dayOfWeek, startTime, endTime, location, professor, semesterYear, semesterPeriod } = body;
            
            if (!subjectName || dayOfWeek === undefined || !startTime || !endTime) {
                return { status: 400, jsonBody: { success: false, message: 'Datos incompletos' } };
            }
            
            const { data: newClass, error } = await supabase
                .from('classes')
                .insert([{
                    userid: userId,
                    subjectname: subjectName,
                    dayofweek: dayOfWeek,
                    starttime: startTime,
                    endtime: endTime,
                    location: location || null,
                    professor: professor || null,
                    semesteryear: semesterYear || new Date().getFullYear(),
                    semesterperiod: semesterPeriod || 'Otoño'
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return {
                status: 201,
                jsonBody: { success: true, data: { classId: newClass.classid }, message: 'Clase creada' }
            };
        } catch (error) {
            context.error('CreateClass error:', error);
            return { status: 500, jsonBody: { success: false, message: 'Error al crear clase' } };
        }
    }
});
