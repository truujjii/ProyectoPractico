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

    // Obtener TODAS las clases sin filtrar por user_id
    const { data: allSchedule, error } = await supabase
      .from('schedule')
      .select('id, user_id, subject_name, day_of_week')
      .limit(10);

    if (error) throw error;

    // Obtener user_ids únicos
    const uniqueUserIds = [...new Set(allSchedule?.map(c => c.user_id) || [])];

    return res.status(200).json({
      success: true,
      totalClasses: allSchedule?.length || 0,
      uniqueUserIds: uniqueUserIds,
      sample: allSchedule?.slice(0, 3).map(c => ({
        id: c.id,
        userId: c.user_id,
        subject: c.subject_name,
        day: c.day_of_week
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
