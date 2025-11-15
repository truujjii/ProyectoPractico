/**
 * Smart UNI-BOT - Funciones de escritura en Google Sheets
 * Permite crear, actualizar y eliminar datos en Google Sheets vía Apps Script
 */

// URL del Apps Script desplegado
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxs85szYO7Jv91zoSRvm4X58P9dsUchZikAz6UXDZWlKHUfg4koOJ61UV9ZPj4Kcgtf/exec';

/**
 * Función genérica para llamar al Apps Script
 */
async function callAppsScript(action, data) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...data
            }),
            redirect: 'follow'
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error llamando a Apps Script:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// ============================================
// FUNCIONES DE ESCRITURA PARA CLASES
// ============================================

/**
 * Escribir clase en Google Sheets
 */
async function writeClassToSheets(classData) {
    console.log('📤 Escribiendo clase en Google Sheets:', classData);
    
    const result = await callAppsScript('addClass', {
        class: {
            id: classData.id,
            user_id: classData.user_id,
            subject_name: classData.subject_name,
            day_of_week: classData.day_of_week,
            start_time: classData.start_time,
            end_time: classData.end_time,
            location: classData.location,
            professor: classData.professor
        }
    });
    
    if (result.success) {
        console.log('✅ Clase escrita en Google Sheets');
    } else {
        console.error('❌ Error escribiendo clase en Google Sheets:', result.message);
    }
    
    return result;
}

/**
 * Actualizar clase en Google Sheets
 */
async function updateClassInSheets(classData) {
    console.log('🔄 Actualizando clase en Google Sheets:', classData);
    
    const result = await callAppsScript('updateClass', {
        class: {
            id: classData.id,
            user_id: classData.user_id,
            subject_name: classData.subject_name,
            day_of_week: classData.day_of_week,
            start_time: classData.start_time,
            end_time: classData.end_time,
            location: classData.location,
            professor: classData.professor
        }
    });
    
    if (result.success) {
        console.log('✅ Clase actualizada en Google Sheets');
    } else {
        console.error('❌ Error actualizando clase en Google Sheets:', result.message);
    }
    
    return result;
}

/**
 * Eliminar clase de Google Sheets
 */
async function deleteClassFromSheets(classId) {
    console.log('🗑️ Eliminando clase de Google Sheets:', classId);
    
    const result = await callAppsScript('deleteClass', {
        classId: classId
    });
    
    if (result.success) {
        console.log('✅ Clase eliminada de Google Sheets');
    } else {
        console.error('❌ Error eliminando clase de Google Sheets:', result.message);
    }
    
    return result;
}

// ============================================
// FUNCIONES DE ESCRITURA PARA TAREAS
// ============================================

/**
 * Escribir tarea en Google Sheets
 */
async function writeTaskToSheets(taskData) {
    console.log('📤 Escribiendo tarea en Google Sheets:', taskData);
    
    const result = await callAppsScript('addTask', {
        task: {
            id: taskData.id,
            user_id: taskData.user_id,
            title: taskData.title,
            subject: taskData.subject,
            due_date: taskData.due_date,
            is_completed: taskData.is_completed || false,
            created_at: taskData.created_at
        }
    });
    
    if (result.success) {
        console.log('✅ Tarea escrita en Google Sheets');
    } else {
        console.error('❌ Error escribiendo tarea en Google Sheets:', result.message);
    }
    
    return result;
}

/**
 * Actualizar tarea en Google Sheets
 */
async function updateTaskInSheets(taskData) {
    console.log('🔄 Actualizando tarea en Google Sheets:', taskData);
    
    const result = await callAppsScript('updateTask', {
        task: {
            id: taskData.id,
            user_id: taskData.user_id,
            title: taskData.title,
            subject: taskData.subject,
            due_date: taskData.due_date,
            is_completed: taskData.is_completed,
            created_at: taskData.created_at
        }
    });
    
    if (result.success) {
        console.log('✅ Tarea actualizada en Google Sheets');
    } else {
        console.error('❌ Error actualizando tarea en Google Sheets:', result.message);
    }
    
    return result;
}

/**
 * Eliminar tarea de Google Sheets
 */
async function deleteTaskFromSheets(taskId) {
    console.log('🗑️ Eliminando tarea de Google Sheets:', taskId);
    
    const result = await callAppsScript('deleteTask', {
        taskId: taskId
    });
    
    if (result.success) {
        console.log('✅ Tarea eliminada de Google Sheets');
    } else {
        console.error('❌ Error eliminando tarea de Google Sheets:', result.message);
    }
    
    return result;
}

// Exportar funciones al objeto window
if (typeof window !== 'undefined') {
    window.SheetsWriter = {
        writeClassToSheets,
        updateClassInSheets,
        deleteClassFromSheets,
        writeTaskToSheets,
        updateTaskInSheets,
        deleteTaskFromSheets
    };
}
