// Endpoint para verificar tasks por user_id y muestra general
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const targetUserId = '46e20e7d-4fa6-46db-af3c-c9bae7b9657c';

    // Tareas del usuario
    const { data: userTasks, error: userError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', targetUserId)
      .order('due_date', { ascending: true });

    // Muestra global
    const { data: allTasks, error: allError } = await supabase
      .from('tasks')
      .select('id, user_id, title, due_date, is_completed')
      .limit(10)
      .order('due_date', { ascending: true });

    return res.status(200).json({
      success: true,
      targetUserId,
      userTasks: {
        count: userTasks?.length || 0,
        sample: userTasks?.slice(0, 5) || []
      },
      allTasks: {
        total: allTasks?.length || 0,
        uniqueUserIds: [...new Set((allTasks || []).map(t => t.user_id))],
        sample: allTasks?.slice(0, 5) || []
      },
      errors: {
        userError: userError?.message || null,
        allError: allError?.message || null
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
