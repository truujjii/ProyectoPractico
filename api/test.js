module.exports = async (req, res) => {
  res.status(200).json({ 
    message: 'Chat API está funcionando',
    method: req.method,
    hasBody: !!req.body,
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    }
  });
};
