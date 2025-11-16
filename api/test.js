// Función de prueba para verificar que Vercel funciona
module.exports = async (req, res) => {
  console.log('=== DEBUG TEST ENDPOINT ===');
  console.log('Request received:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  try {
    const response = { 
      success: true,
      message: '✅ Vercel API está funcionando correctamente',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      env: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      },
      debug: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    console.log('Response:', JSON.stringify(response, null, 2));
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
};
