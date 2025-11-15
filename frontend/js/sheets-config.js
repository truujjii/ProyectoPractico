/* ============================================
   Smart UNI-BOT - Configuración Google Sheets
   ============================================ */

// ID del Google Sheet
// IMPORTANTE: El Google Sheet debe estar configurado como "Cualquier persona con el enlace puede VER"
const GOOGLE_SHEET_ID = '1RnD7UmG-X3UjzwM7-Dobk9JBhl3r61nBgEdw9IDPYws';

// API Key de Google (pública, solo lectura de Sheets)
const GOOGLE_API_KEY = 'AIzaSyDZymbwxK0X-5CDa958szRFYvmzsgA4_rE';

// Nombres de las hojas
const SHEET_NAMES = {
    TASKS: 'Tareas',
    CLASSES: 'Clases'
};

// Exportar configuración
window.SheetsConfig = {
    SHEET_ID: GOOGLE_SHEET_ID,
    API_KEY: GOOGLE_API_KEY,
    SHEET_NAMES: SHEET_NAMES
};
