// Endpoint para verificar user_id de las clases
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

    // Obtener clases del usuario específico
    const { data: userSchedule, error: userError } = await supabase
      .from('schedule')
      .select('*')
      .eq('user_id', targetUserId);

    // Obtener TODAS las clases sin filtrar
    const { data: allSchedule, error: allError } = await supabase
      .from('schedule')
      .select('id, user_id, subject_name, day_of_week')
      .limit(10);

    return res.status(200).json({
      success: true,
      targetUserId,
      userClasses: {
        count: userSchedule?.length || 0,
        sample: userSchedule?.slice(0, 3) || []
      },
      allClasses: {
        total: allSchedule?.length || 0,
        uniqueUserIds: [...new Set(allSchedule?.map(c => c.user_id) || [])],
        sample: allSchedule?.slice(0, 3) || []
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
