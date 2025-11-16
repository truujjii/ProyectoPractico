const { createClient } = require('@supabase/supabase-js');

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Función para obtener contexto del usuario desde Supabase
async function getUserContext(userId) {
  try {
    console.log('Buscando datos para userId:', userId);
    
    // Obtener horario del usuario
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (scheduleError) {
      console.error('Error en schedule:', scheduleError);
      throw scheduleError;
    }
    
    console.log('Schedule encontrado:', schedule?.length || 0, 'clases');

    // Obtener tareas del usuario
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (tasksError) {
      console.error('Error en tasks:', tasksError);
      throw tasksError;
    }
    
    console.log('Tasks encontradas:', tasks?.length || 0, 'tareas');

    return { schedule: schedule || [], tasks: tasks || [] };
  } catch (error) {
    console.error('Error obteniendo contexto del usuario:', error);
    throw error;
  }
}

// Función para llamar a la API de Gemini
async function callGeminiAPI(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\nUsuario: ${userMessage}`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Respuesta inválida de Gemini API');
    }
  } catch (error) {
    console.error('Error llamando a Gemini API:', error);
    throw error;
  }
}

// Handler principal de Vercel
module.exports = async (req, res) => {
  // Manejar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  console.log('=== CHAT API REQUEST ===');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'El mensaje es requerido' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'El ID de usuario es requerido' 
      });
    }

    console.log('Usuario ID:', userId);
    console.log('Mensaje:', message);

    // Obtener contexto del usuario
    console.log('Obteniendo contexto del usuario...');
    const { schedule, tasks } = await getUserContext(userId);
    console.log('Contexto obtenido:', { scheduleCount: schedule.length, tasksCount: tasks.length });

    // Construir el prompt del sistema con el contexto
    const systemPrompt = `Eres un asistente académico inteligente para estudiantes universitarios.

CONTEXTO DEL USUARIO:

HORARIO DE CLASES:
${schedule.length > 0 ? schedule.map(c => `- ${c.subject_name || c.subject} (${c.day_of_week}) ${c.start_time}-${c.end_time} en ${c.location || 'Sin ubicación'}`).join('\n') : 'No hay clases registradas'}

TAREAS PENDIENTES:
${tasks.filter(t => !t.is_completed && !t.completed).length > 0 ? tasks.filter(t => !t.is_completed && !t.completed).map(t => `- ${t.title} (${t.subject || 'Sin asignatura'}) - Vence: ${t.due_date}${t.priority === 'high' || t.priority === 'Alta' ? ' [ALTA PRIORIDAD]' : ''}`).join('\n') : 'No hay tareas pendientes'}

INSTRUCCIONES:
- Responde de forma amigable y útil en español
- Usa la información del horario y tareas para dar respuestas personalizadas
- Si te preguntan por clases hoy, calcula el día actual y busca en el horario
- Si te preguntan por tareas, prioriza las más urgentes
- Sé conciso pero informativo
- Usa emojis ocasionalmente para hacer la conversación más amigable`;

    console.log('Llamando a Gemini API...');
    // Llamar a Gemini API
    const aiResponse = await callGeminiAPI(systemPrompt, message);
    console.log('Respuesta de Gemini obtenida');

    return res.status(200).json({
      success: true,
      data: {
        response: aiResponse,
        context: {
          scheduleCount: schedule.length,
          tasksCount: tasks.length,
          pendingTasksCount: tasks.filter(t => !t.is_completed && !t.completed).length
        }
      }
    });

  } catch (error) {
    console.error('=== ERROR EN CHAT API ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Error procesando tu mensaje',
      details: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};
