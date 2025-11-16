// Endpoint para verificar variables de entorno
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Listar TODAS las variables de entorno (sin mostrar valores completos por seguridad)
  const allEnvKeys = Object.keys(process.env);
  
  // Buscar variables relacionadas con nuestro proyecto
  const supabaseKeys = allEnvKeys.filter(k => k.toLowerCase().includes('supabase'));
  const geminiKeys = allEnvKeys.filter(k => k.toLowerCase().includes('gemini'));
  const allKeys = allEnvKeys.filter(k => 
    k.includes('SUPABASE') || 
    k.includes('GEMINI') || 
    k.includes('SQL') ||
    k.includes('AZURE')
  );
  
  return res.status(200).json({
    success: true,
    message: 'Diagnóstico de variables de entorno',
    totalEnvVars: allEnvKeys.length,
    expectedVars: {
      'SUPABASE_URL': {
        exists: !!process.env.SUPABASE_URL,
        length: process.env.SUPABASE_URL?.length || 0,
        preview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : null
      },
      'SUPABASE_ANON_KEY': {
        exists: !!process.env.SUPABASE_ANON_KEY,
        length: process.env.SUPABASE_ANON_KEY?.length || 0,
        preview: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : null
      },
      'GEMINI_API_KEY': {
        exists: !!process.env.GEMINI_API_KEY,
        length: process.env.GEMINI_API_KEY?.length || 0,
        preview: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 20) + '...' : null
      }
    },
    foundRelatedKeys: {
      supabase: supabaseKeys,
      gemini: geminiKeys,
      all: allKeys
    },
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV
  });
};
