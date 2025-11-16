/**
 * API Route: /api/chat
 * Maneja peticiones del chatbot usando Google Gemini API
 * con acceso a la base de datos del usuario
 */

import { createClient } from '@supabase/supabase-js';

// Inicializar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/**
 * Obtener contexto del usuario desde la BD
 */
async function getUserContext(userId) {
    try {
        // Obtener horario
        const { data: schedule, error: scheduleError } = await supabase
            .from('schedule')
            .select('*')
            .eq('user_id', userId);
        
        if (scheduleError) throw scheduleError;
        
        // Obtener tareas
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);
        
        if (tasksError) throw tasksError;
        
        // Formatear contexto
        const scheduleText = schedule.map(c => 
            `${c.subject_name} - Día ${c.day_of_week} de ${c.start_time} a ${c.end_time} en ${c.location || 'ubicación desconocida'} con ${c.professor || 'profesor desconocido'}`
        ).join('\n');
        
        const tasksText = tasks.map(t => 
            `${t.title} (${t.subject || 'sin asignatura'}) - Vence: ${t.due_date || 'sin fecha'} - Prioridad: ${t.priority || 'Media'} - ${t.is_completed ? 'Completada' : 'Pendiente'}`
        ).join('\n');
        
        const pendingTasks = tasks.filter(t => !t.is_completed);
        const completedTasks = tasks.filter(t => t.is_completed);
        
        return {
            schedule,
            tasks,
            contextText: `
HORARIO DEL ESTUDIANTE:
${scheduleText || 'No tiene clases registradas'}

TAREAS PENDIENTES (${pendingTasks.length}):
${tasksText || 'No tiene tareas'}

ESTADÍSTICAS:
- Total clases: ${schedule.length}
- Total tareas: ${tasks.length}
- Tareas pendientes: ${pendingTasks.length}
- Tareas completadas: ${completedTasks.length}
`.trim()
        };
    } catch (error) {
        console.error('Error obteniendo contexto:', error);
        return {
            schedule: [],
            tasks: [],
            contextText: 'No se pudo obtener información del usuario.'
        };
    }
}

/**
 * Llamar a Google Gemini API
 */
async function callGeminiAPI(systemPrompt, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Combinar system prompt y mensaje del usuario
    const fullPrompt = `${systemPrompt}\n\nUsuario: ${userMessage}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
                topP: 0.95
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
    }
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Lo siento, no pude generar una respuesta.';
}

/**
 * Handler principal
 */
export default async function handler(req, res) {
    // Solo aceptar POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { message, userId } = req.body;
        
        if (!message || !userId) {
            return res.status(400).json({ error: 'Missing message or userId' });
        }
        
        // Obtener contexto del usuario
        const context = await getUserContext(userId);
        
        // Construir prompt del sistema
        const systemPrompt = `Eres Smart UNI-BOT, un asistente personal universitario inteligente. 

Tu objetivo es ayudar al estudiante con su organización académica. Puedes:
- Consultar su horario de clases
- Revisar sus tareas pendientes y completadas
- Dar consejos de organización y productividad
- Responder preguntas sobre sus asignaturas
- Sugerir prioridades basándote en fechas de entrega

IMPORTANTE:
- Sé amigable, cercano y motivador
- Usa emojis cuando sea apropiado
- Responde en español
- Si no tienes información, dilo claramente
- Las respuestas deben ser concisas (máximo 3-4 líneas)

CONTEXTO DEL ESTUDIANTE:
${context.contextText}`;
        
        // Llamar a Gemini API
        const reply = await callGeminiAPI(systemPrompt, message);
        
        return res.status(200).json({
            success: true,
            reply,
            context: {
                totalClasses: context.schedule.length,
                totalTasks: context.tasks.length,
                pendingTasks: context.tasks.filter(t => !t.is_completed).length
            }
        });
        
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error procesando tu mensaje',
            details: error.message
        });
    }
}
