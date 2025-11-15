/**
 * Smart UNI-BOT - Google Apps Script para sincronización bidireccional
 * Este script permite leer y escribir en Google Sheets desde la web
 */

const SHEET_ID = '1RnD7UmG-X3UjzwM7-Dobk9JBhl3r61nBgEdw9IDPYws';

/**
 * Manejar solicitudes OPTIONS (CORS preflight)
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manejar solicitudes POST desde la web
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    let result = {};
    
    switch(data.action) {
      case 'addClass':
        result = addClass(spreadsheet, data.class);
        break;
      case 'updateClass':
        result = updateClass(spreadsheet, data.class);
        break;
      case 'deleteClass':
        result = deleteClass(spreadsheet, data.classId);
        break;
      case 'addTask':
        result = addTask(spreadsheet, data.task);
        break;
      case 'updateTask':
        result = updateTask(spreadsheet, data.task);
        break;
      case 'deleteTask':
        result = deleteTask(spreadsheet, data.taskId);
        break;
      default:
        result = { success: false, message: 'Acción no reconocida' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Manejar solicitudes GET (para testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Smart UNI-BOT Apps Script funcionando'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// FUNCIONES DE CLASES
// ============================================

/**
 * Añadir nueva clase
 */
function addClass(spreadsheet, classData) {
  const sheet = spreadsheet.getSheetByName('Clases');
  
  // Añadir fila al final
  sheet.appendRow([
    classData.id,
    classData.user_id,
    classData.subject_name,
    classData.day_of_week,
    classData.start_time,
    classData.end_time,
    classData.location || '',
    classData.professor || ''
  ]);
  
  return {
    success: true,
    message: 'Clase añadida a Google Sheets',
    id: classData.id
  };
}

/**
 * Actualizar clase existente
 */
function updateClass(spreadsheet, classData) {
  const sheet = spreadsheet.getSheetByName('Clases');
  const data = sheet.getDataRange().getValues();
  
  // Buscar la fila por ID (columna A)
  for (let i = 1; i < data.length; i++) { // Empezar en 1 para saltar headers
    if (data[i][0] === classData.id) {
      // Actualizar la fila
      sheet.getRange(i + 1, 1, 1, 8).setValues([[
        classData.id,
        classData.user_id,
        classData.subject_name,
        classData.day_of_week,
        classData.start_time,
        classData.end_time,
        classData.location || '',
        classData.professor || ''
      ]]);
      
      return {
        success: true,
        message: 'Clase actualizada en Google Sheets'
      };
    }
  }
  
  return {
    success: false,
    message: 'Clase no encontrada en Google Sheets'
  };
}

/**
 * Eliminar clase
 */
function deleteClass(spreadsheet, classId) {
  const sheet = spreadsheet.getSheetByName('Clases');
  const data = sheet.getDataRange().getValues();
  
  // Buscar la fila por ID (columna A)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === classId) {
      sheet.deleteRow(i + 1);
      return {
        success: true,
        message: 'Clase eliminada de Google Sheets'
      };
    }
  }
  
  return {
    success: false,
    message: 'Clase no encontrada en Google Sheets'
  };
}

// ============================================
// FUNCIONES DE TAREAS
// ============================================

/**
 * Añadir nueva tarea
 */
function addTask(spreadsheet, taskData) {
  const sheet = spreadsheet.getSheetByName('Tareas');
  
  sheet.appendRow([
    taskData.id,
    taskData.user_id,
    taskData.title,
    taskData.subject || '',
    taskData.due_date,
    taskData.is_completed || false,
    taskData.created_at
  ]);
  
  return {
    success: true,
    message: 'Tarea añadida a Google Sheets',
    id: taskData.id
  };
}

/**
 * Actualizar tarea existente
 */
function updateTask(spreadsheet, taskData) {
  const sheet = spreadsheet.getSheetByName('Tareas');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === taskData.id) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        taskData.id,
        taskData.user_id,
        taskData.title,
        taskData.subject || '',
        taskData.due_date,
        taskData.is_completed || false,
        taskData.created_at
      ]]);
      
      return {
        success: true,
        message: 'Tarea actualizada en Google Sheets'
      };
    }
  }
  
  return {
    success: false,
    message: 'Tarea no encontrada en Google Sheets'
  };
}

/**
 * Eliminar tarea
 */
function deleteTask(spreadsheet, taskId) {
  const sheet = spreadsheet.getSheetByName('Tareas');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === taskId) {
      sheet.deleteRow(i + 1);
      return {
        success: true,
        message: 'Tarea eliminada de Google Sheets'
      };
    }
  }
  
  return {
    success: false,
    message: 'Tarea no encontrada en Google Sheets'
  };
}