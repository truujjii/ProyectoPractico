// Endpoint para listar modelos disponibles de Gemini
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: 'Error al listar modelos',
        details: data
      });
    }
    
    // Extraer solo los modelos que soportan generateContent
    const contentModels = data.models
      ?.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description
      })) || [];
    
    return res.status(200).json({
      success: true,
      availableModels: contentModels,
      totalModels: data.models?.length || 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};
