/* ============================================
   Smart UNI-BOT - Sincronización Google Sheets
   ============================================ */

// Leer datos desde Google Sheets usando la API v4
async function readFromSheets(sheetName, range = 'A2:Z1000') {
    try {
        const sheetId = window.SheetsConfig.SHEET_ID;
        const apiKey = window.SheetsConfig.API_KEY;
        const fullRange = `${sheetName}!${range}`;
        
        // Usar API v4 de Google Sheets con API Key
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(fullRange)}?key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error de Google Sheets API:', errorData);
            throw new Error(`Error al leer Google Sheets: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.values || [];
        
    } catch (error) {
        console.error('Error leyendo desde Google Sheets:', error);
        throw error;
    }
}

// Escribir datos a Google Sheets
async function writeToSheets(sheetName, values, range = 'A2') {
    try {
        const sheetId = window.SheetsConfig.SHEET_ID;
        const fullRange = `${sheetName}!${range}`;
        
        // Por ahora usaremos método simplificado
        // En producción esto debe hacerse desde backend
        console.log('📝 Escribiendo a Google Sheets:', { sheetName, values });
        
        showNotification('Datos preparados para sincronizar', 'info');
        
        return { success: true };
        
    } catch (error) {
        console.error('Error escribiendo a Google Sheets:', error);
        showNotification('Error al escribir en Google Sheets', 'error');
        throw error;
    }
}

// Sincronizar tareas desde Google Sheets a Supabase
async function syncTasksFromSheets() {
    try {
        showLoading('Sincronizando tareas desde Google Sheets...');
        
        const rows = await readFromSheets(window.SheetsConfig.SHEET_NAMES.TASKS);
        
        if (!rows || rows.length === 0) {
            showNotification('ℹ️ No hay tareas en Google Sheets', 'info');
            return;
        }
        
        const user = JSON.parse(localStorage.getItem('user'));
        let syncedCount = 0;
        let createdCount = 0;
        let updatedCount = 0;
        
        for (const row of rows) {
            try {
                // Formato: id | user_id | title | subject | due_date | is_completed | created_at | priority
                const [sheetId, userId, title, subject, dueDate, isCompleted, createdAt, priority] = row;
                
                // Validar que tiene los datos mínimos
                if (!sheetId || !userId || !title) {
                    console.warn('Fila inválida, saltando:', row);
                    continue;
                }
                
                // Solo sincronizar tareas del usuario actual
                if (userId !== user.id) continue;
                
                // Verificar si la tarea ya existe en Supabase
                const { data: existing, error: checkError } = await supabaseClient
                    .from('tasks')
                    .select('id')
                    .eq('id', sheetId)
                    .maybeSingle();
                
                if (checkError && checkError.code !== 'PGRST116') {
                    console.error('Error verificando tarea:', checkError);
                    continue;
                }
                
                const taskData = {
                    id: sheetId,
                    user_id: userId,
                    title: title,
                    subject: subject || null,
                    due_date: dueDate || null,
                    is_completed: isCompleted === 'TRUE' || isCompleted === 'true' || isCompleted === true,
                    priority: priority || 'Media',
                    created_at: createdAt || new Date().toISOString()
                };
                
                if (existing) {
                    // Ya existe, no hacer nada (no sobrescribir cambios del usuario)
                    console.log('⏭️ Tarea ya existe, omitiendo:', sheetId);
                } else {
                    // Crear nueva tarea
                    const { error: insertError } = await supabaseClient
                        .from('tasks')
                        .insert(taskData);
                    
                    if (insertError) {
                        console.error('Error creando tarea:', insertError);
                    } else {
                        createdCount++;
                        syncedCount++;
                    }
                }
                
                syncedCount++;
                
            } catch (rowError) {
                console.error('Error procesando fila:', rowError, row);
            }
        }
        
        if (createdCount > 0) {
            showNotification(`✅ ${createdCount} tarea(s) nueva(s) añadida(s) desde el campus virtual`, 'success');
            
            // Recargar tareas en la UI
            if (typeof loadTasks === 'function') {
                await loadTasks();
            }
        } else {
            showNotification('ℹ️ No se encontraron tareas para sincronizar', 'info');
        }
        
    } catch (error) {
        console.error('Error sincronizando tareas desde Sheets:', error);
        showNotification('❌ Error al sincronizar tareas', 'error');
    } finally {
        hideLoading();
    }
}

// Sincronizar clases desde Google Sheets a Supabase
async function syncClassesFromSheets() {
    try {
        showLoading('Sincronizando clases desde Google Sheets...');
        
        const rows = await readFromSheets(window.SheetsConfig.SHEET_NAMES.CLASSES);
        
        console.log('📊 Filas leídas de Google Sheets (Clases):', rows);
        
        if (!rows || rows.length === 0) {
            showNotification('ℹ️ No hay clases en Google Sheets', 'info');
            return;
        }
        
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('👤 User ID actual:', user.id);
        
        let syncedCount = 0;
        let createdCount = 0;
        let updatedCount = 0;
        
        for (const row of rows) {
            try {
                // Formato: id | user_id | subject_name | day_of_week | start_time | end_time | location | professor
                const [sheetId, userId, subjectName, dayOfWeek, startTime, endTime, location, professor] = row;
                
                console.log('📝 Procesando fila:', { sheetId, userId, subjectName, dayOfWeek, startTime, endTime });
                
                // Validar que tiene los datos mínimos
                if (!sheetId || !userId || !subjectName || !dayOfWeek || !startTime || !endTime) {
                    console.warn('⚠️ Fila inválida, saltando:', row);
                    continue;
                }
                
                // Solo sincronizar clases del usuario actual
                if (userId !== user.id) {
                    console.log('⏭️ Saltando clase de otro usuario:', userId);
                    continue;
                }
                
                console.log('✅ Clase válida para sincronizar:', subjectName);
                
                // Verificar si la clase ya existe en Supabase
                const { data: existing, error: checkError } = await supabaseClient
                    .from('schedule')
                    .select('id')
                    .eq('id', sheetId)
                    .maybeSingle();
                
                if (checkError && checkError.code !== 'PGRST116') {
                    console.error('❌ Error verificando clase:', checkError);
                    continue;
                }
                
                const classData = {
                    id: sheetId,
                    user_id: userId,
                    subject_name: subjectName,
                    day_of_week: parseInt(dayOfWeek),
                    start_time: startTime,
                    end_time: endTime,
                    location: location || '',
                    professor: professor || ''
                };
                
                console.log('💾 Datos a guardar:', classData);
                
                if (existing) {
                    // Ya existe, no hacer nada (no sobrescribir cambios del usuario)
                    console.log('⏭️ Clase ya existe, omitiendo:', sheetId);
                } else {
                    // Crear nueva clase
                    console.log('➕ Creando nueva clase:', sheetId);
                    const { error: insertError } = await supabaseClient
                        .from('schedule')
                        .insert(classData);
                    
                    if (insertError) {
                        console.error('❌ Error creando clase:', insertError);
                    } else {
                        console.log('✅ Clase creada');
                        createdCount++;
                        syncedCount++;
                    }
                }
                
                syncedCount++;
                
            } catch (rowError) {
                console.error('❌ Error procesando fila:', rowError, row);
            }
        }
        
        console.log('📊 Resumen:', { sincronizadas: syncedCount, nuevas: createdCount });
        
        if (createdCount > 0) {
            showNotification(`✅ ${createdCount} clase(s) nueva(s) añadida(s) desde el campus virtual`, 'success');
            
            // Recargar horario en la UI
            if (typeof loadSchedule === 'function') {
                await loadSchedule();
            }
        } else {
            showNotification('ℹ️ No se encontraron clases para sincronizar', 'info');
        }
        
    } catch (error) {
        console.error('❌ Error sincronizando clases desde Sheets:', error);
        showNotification('❌ Error al sincronizar clases', 'error');
    } finally {
        hideLoading();
    }
}

// Sincronizar todo
async function syncAllFromSheets() {
    try {
        showLoading('Sincronizando todo desde Google Sheets...');
        
        await syncTasksFromSheets();
        await syncClassesFromSheets();
        
        showNotification('✅ Sincronización completa exitosa', 'success');
        
    } catch (error) {
        console.error('Error en sincronización completa:', error);
        showNotification('Error en la sincronización', 'error');
    } finally {
        hideLoading();
    }
}

// Exportar funciones
window.SheetsSync = {
    syncTasksFromSheets,
    syncClassesFromSheets,
    syncAllFromSheets,
    readFromSheets,
    writeToSheets
};
