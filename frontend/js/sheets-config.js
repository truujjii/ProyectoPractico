/* ============================================
   Smart UNI-BOT - Configuración Google Sheets
   ============================================ */

// ID del Google Sheet
// IMPORTANTE: El Google Sheet debe estar configurado como "Cualquier persona con el enlace puede VER"
const GOOGLE_SHEET_ID = '1RnD7UmG-X3UjzwM7-Dobk9JBhl3r61nBgEdw9IDPYws';

// Nombres de las hojas
const SHEET_NAMES = {
    TASKS: 'Tareas',
    CLASSES: 'Clases'
};

// Exportar configuración
window.SheetsConfig = {
    SHEET_ID: GOOGLE_SHEET_ID,
    SHEET_NAMES: SHEET_NAMES
};
