// Función de prueba para verificar que Vercel funciona
export default async function handler(req, res) {
  return res.status(200).json({ 
    success: true,
    message: 'Vercel API está funcionando correctamente',
    timestamp: new Date().toISOString(),
    method: req.method,
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    }
  });
}
