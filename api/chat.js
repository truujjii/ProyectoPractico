/**
 * API Route: /api/chat
 * Maneja peticiones del chatbot usando Azure OpenAI GPT-4
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
 * Llamar a Azure OpenAI GPT-4
 */
async function callAzureOpenAI(messages) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
    
    if (!endpoint || !apiKey) {
        throw new Error('Azure OpenAI credentials not configured');
    }
    
    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
        },
        body: JSON.stringify({
            messages,
            temperature: 0.7,
            max_tokens: 800,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Azure OpenAI error: ${error}`);
    }
    
    return response.json();
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
        
        // Construir mensajes para GPT-4
        const messages = [
            {
                role: 'system',
                content: `Eres Smart UNI-BOT, un asistente personal universitario inteligente. 
                
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
${context.contextText}
`
            },
            {
                role: 'user',
                content: message
            }
        ];
        
        // Llamar a Azure OpenAI
        const aiResponse = await callAzureOpenAI(messages);
        
        const reply = aiResponse.choices[0]?.message?.content || 'Lo siento, no pude procesar tu pregunta.';
        
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
