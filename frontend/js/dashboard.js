// Estado global
let currentSchedule = [];
let currentTasks = [];
let currentFilter = 'all';
let editingClassId = null;
let editingTaskId = null;

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const sessionId = localStorage.getItem('sessionId');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!sessionId || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar información del usuario
    const userName = user.user_metadata?.first_name 
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() 
        : user.email.split('@')[0];
    document.getElementById('user-info').textContent = `👤 ${userName}`;
    
    // Verificar si es admin - SIMPLE: solo revisar localStorage
    const userRole = localStorage.getItem('userRole');
    console.log('User role from localStorage:', userRole);
    
    if (userRole === 'admin') {
        console.log('User is admin! Showing button...');
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.style.display = 'inline-block';
            console.log('Admin button shown');
        }
    }
    
    // Cargar datos
    await loadDashboard();
});

// Cargar todo el dashboard
async function loadDashboard() {
    showLoading();
    
    try {
        // Cargar horario y tareas en paralelo
        await Promise.all([
            loadSchedule(),
            loadTasks()
        ]);
        
        // Renderizar quick view
        renderQuickView();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error al cargar el dashboard', 'error');
    } finally {
        hideLoading();
    }
}

// Cargar horario
async function loadSchedule() {
    try {
        const response = await getSchedule();
        if (response.success) {
            // Convertir snake_case a camelCase para compatibilidad con el resto del código
            currentSchedule = (response.data.classes || []).map(c => ({
                classId: c.id,
                subjectName: c.subject_name,
                dayOfWeek: c.day_of_week,
                startTime: c.start_time,
                endTime: c.end_time,
                location: c.location,
                professor: c.professor,
                semesterYear: c.semester_year,
                semesterPeriod: c.semester_period
            }));
            renderScheduleGrid();
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        showNotification('Error al cargar horario', 'error');
    }
}

// Renderizar grid de horario semanal
function renderScheduleGrid() {
    const grid = document.getElementById('schedule-grid');
    
    if (currentSchedule.length === 0) {
        grid.innerHTML = '<div class="empty-state">📅 No tienes clases programadas. ¡Añade tu primera clase!</div>';
        return;
    }
    
    // Días de la semana (Lunes a Domingo)
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    let html = '';
    
    // Crear columnas para cada día (1=Lunes, 7=Domingo)
    days.forEach((day, index) => {
        const dayNumber = index + 1; // 1=Lunes, 2=Martes, ..., 7=Domingo
        const dayClasses = currentSchedule.filter(c => c.dayOfWeek === dayNumber);
        
        html += `
            <div class="day-column">
                <div class="day-header">${day}</div>
                <div class="day-content">
        `;
        
        if (dayClasses.length === 0) {
            html += '<div class="no-classes">Sin clases</div>';
        } else {
            dayClasses.forEach(classItem => {
                html += `
                    <div class="class-item">
                        <div class="class-info">
                            <div class="class-subject">${escapeHtml(classItem.subjectName)}</div>
                            <div class="class-time">⏰ ${classItem.startTime} - ${classItem.endTime}</div>
                            ${classItem.location ? `<div class="class-location">📍 ${escapeHtml(classItem.location)}</div>` : ''}
                            ${classItem.professor ? `<div class="class-professor">👨‍🏫 ${escapeHtml(classItem.professor)}</div>` : ''}
                        </div>
                        <div class="class-actions">
                            <button class="btn-icon" onclick="editClass(${classItem.classId})" title="Editar">✏️</button>
                            <button class="btn-icon" onclick="deleteClassItem(${classItem.classId})" title="Eliminar">🗑️</button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Cargar tareas
async function loadTasks() {
    try {
        const response = await getTasks(currentFilter);
        if (response.success) {
            // Convertir snake_case a camelCase
            currentTasks = (response.data.tasks || []).map(t => ({
                taskId: t.id,
                title: t.title,
                description: t.description,
                subject: t.subject,
                dueDate: t.due_date,
                priority: t.priority,
                isCompleted: t.is_completed,
                completedAt: t.completed_at
            }));
            renderTasksList();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Error al cargar tareas', 'error');
    }
}

// Renderizar lista de tareas
function renderTasksList() {
    const list = document.getElementById('tasks-list');
    
    if (currentTasks.length === 0) {
        let message = '📝 No tienes tareas';
        if (currentFilter === 'pending') message = '✅ ¡No tienes tareas pendientes!';
        if (currentFilter === 'completed') message = '📋 No has completado ninguna tarea aún';
        
        list.innerHTML = `<div class="empty-state">${message}</div>`;
        return;
    }
    
    let html = '';
    
    currentTasks.forEach(task => {
        const isCompleted = task.isCompleted;
        const borderColor = isCompleted ? '#999' : '#1E6B52';
        
        html += `
            <div class="task-item ${isCompleted ? 'completed' : ''}" style="border-left: 4px solid ${borderColor}">
                <div class="task-checkbox">
                    <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                           onchange="toggleTaskCompleteAction(${task.taskId}, this.checked)">
                </div>
                <div class="task-info">
                    <div class="task-header">
                        <span class="task-title">${escapeHtml(task.title)}</span>
                        ${task.priority === 'Alta' ? '<span class="task-priority high">⚠️ Alta</span>' : ''}
                        ${task.priority === 'Media' ? '<span class="task-priority medium">➖ Media</span>' : ''}
                        ${task.priority === 'Baja' ? '<span class="task-priority low">🔽 Baja</span>' : ''}
                    </div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        ${task.subject ? `<span>📚 ${escapeHtml(task.subject)}</span>` : ''}
                        ${task.dueDate ? `<span>📅 ${formatDate(task.dueDate)}</span>` : ''}
                        ${isCompleted ? '<span>✅ Completada</span>' : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon" onclick="editTask(${task.taskId})" title="Editar">✏️</button>
                    <button class="btn-icon" onclick="deleteTaskItem(${task.taskId})" title="Eliminar">🗑️</button>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

// Renderizar quick view cards
function renderQuickView() {
    // Próxima clase
    const nextClassCard = document.getElementById('next-class-card').querySelector('.quick-content');
    const jsDay = new Date().getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const today = jsDay === 0 ? 7 : jsDay; // Convertir a 1=Lunes, ..., 7=Domingo
    const todayClasses = currentSchedule.filter(c => c.dayOfWeek === today);
    
    if (todayClasses.length > 0) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const nextClass = todayClasses.find(c => c.startTime > currentTime) || todayClasses[0];
        
        nextClassCard.innerHTML = `
            <p class="quick-title">${escapeHtml(nextClass.subjectName)}</p>
            <p class="quick-time">⏰ ${nextClass.startTime}</p>
            ${nextClass.location ? `<p class="quick-location">📍 ${escapeHtml(nextClass.location)}</p>` : ''}
        `;
    } else {
        nextClassCard.innerHTML = '<p>🎉 No hay clases hoy</p>';
    }
    
    // Tareas pendientes
    const pendingTasksCard = document.getElementById('pending-tasks-card').querySelector('.quick-content');
    const pendingCount = currentTasks.filter(t => !t.isCompleted).length;
    
    if (pendingCount === 0) {
        pendingTasksCard.innerHTML = '<p>✅ ¡Todo al día!</p>';
    } else {
        pendingTasksCard.innerHTML = `
            <p class="quick-number">${pendingCount}</p>
            <p class="quick-label">${pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}</p>
        `;
    }
    
    // Clases de hoy
    const todayScheduleCard = document.getElementById('today-schedule-card').querySelector('.quick-content');
    
    if (todayClasses.length === 0) {
        todayScheduleCard.innerHTML = '<p>📅 Sin clases hoy</p>';
    } else {
        todayScheduleCard.innerHTML = `
            <p class="quick-number">${todayClasses.length}</p>
            <p class="quick-label">${todayClasses.length === 1 ? 'clase hoy' : 'clases hoy'}</p>
        `;
    }
}

// Filtrar tareas
async function filterTasks(filter) {
    currentFilter = filter;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    await loadTasks();
}

// Abrir modal de clase
function openClassModal(classId = null) {
    editingClassId = classId;
    const modal = document.getElementById('class-modal');
    const form = document.getElementById('class-form');
    const title = document.getElementById('class-modal-title');
    
    form.reset();
    
    if (classId) {
        // Modo edición
        title.textContent = '✏️ Editar Clase';
        const classItem = currentSchedule.find(c => c.classId === classId);
        
        if (classItem) {
            document.getElementById('class-id').value = classId;
            document.getElementById('class-subject').value = classItem.subjectName;
            document.getElementById('class-day').value = classItem.dayOfWeek;
            document.getElementById('class-start').value = classItem.startTime;
            document.getElementById('class-end').value = classItem.endTime;
            document.getElementById('class-location').value = classItem.location || '';
            document.getElementById('class-professor').value = classItem.professor || '';
        }
    } else {
        // Modo creación
        title.textContent = '➕ Añadir Clase';
    }
    
    modal.classList.add('active');
}

// Cerrar modal de clase
function closeClassModal() {
    document.getElementById('class-modal').classList.remove('active');
    editingClassId = null;
}

// Guardar clase
async function saveClass(event) {
    event.preventDefault();
    
    const classData = {
        subjectName: document.getElementById('class-subject').value,
        dayOfWeek: parseInt(document.getElementById('class-day').value),
        startTime: document.getElementById('class-start').value,
        endTime: document.getElementById('class-end').value,
        location: document.getElementById('class-location').value || null,
        professor: document.getElementById('class-professor').value || null
    };
    
    try {
        let response;
        
        if (editingClassId) {
            response = await updateClass(editingClassId, classData);
        } else {
            response = await createClass(classData);
        }
        
        if (response.success) {
            showNotification(editingClassId ? 'Clase actualizada' : 'Clase añadida', 'success');
            closeClassModal();
            await loadSchedule();
            renderQuickView();
        } else {
            showNotification(response.message || 'Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error saving class:', error);
        showNotification('Error al guardar clase', 'error');
    }
}

// Editar clase
function editClass(classId) {
    openClassModal(classId);
}

// Eliminar clase
async function deleteClassItem(classId) {
    if (!confirm('¿Estás seguro de eliminar esta clase?')) return;
    
    try {
        const response = await deleteClass(classId);
        
        if (response.success) {
            showNotification('Clase eliminada', 'success');
            await loadSchedule();
            renderQuickView();
        } else {
            showNotification(response.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error deleting class:', error);
        showNotification('Error al eliminar clase', 'error');
    }
}

// Borrar todo el semestre
async function clearSemesterAction() {
    if (!confirm('⚠️ ¿Estás seguro de borrar TODO tu horario? Esta acción no se puede deshacer.')) return;
    
    try {
        showLoading();
        const response = await clearSemester();
        
        if (response.success) {
            showNotification('Horario eliminado correctamente', 'success');
            await loadSchedule();
            renderQuickView();
        } else {
            showNotification(response.message || 'Error al borrar', 'error');
        }
    } catch (error) {
        console.error('Error clearing semester:', error);
        showNotification('Error al borrar horario', 'error');
    } finally {
        hideLoading();
    }
}

// Abrir modal de tarea
function openTaskModal(taskId = null) {
    editingTaskId = taskId;
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const title = document.getElementById('task-modal-title');
    const subjectSelect = document.getElementById('task-subject');
    
    form.reset();
    
    // Llenar desplegable con asignaturas del horario
    subjectSelect.innerHTML = '<option value="">Selecciona una asignatura...</option>';
    
    // Obtener asignaturas únicas del horario
    const subjects = [...new Set(currentSchedule.map(c => c.subjectName))].sort();
    
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
    
    // Agregar opción "Otra" al final
    const otherOption = document.createElement('option');
    otherOption.value = 'Otra';
    otherOption.textContent = '📝 Otra asignatura...';
    subjectSelect.appendChild(otherOption);
    
    if (taskId) {
        // Modo edición
        title.textContent = '✏️ Editar Tarea';
        const task = currentTasks.find(t => t.taskId === taskId);
        
        if (task) {
            document.getElementById('task-id').value = taskId;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-subject').value = task.subject || '';
            document.getElementById('task-due-date').value = task.dueDate.split('T')[0];
            document.getElementById('task-priority').value = task.priority;
        }
    } else {
        // Modo creación
        title.textContent = '➕ Añadir Tarea';
    }
    
    modal.classList.add('active');
}

// Cerrar modal de tarea
function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
    editingTaskId = null;
}

// Guardar tarea
async function saveTask(event) {
    event.preventDefault();
    
    const dueDateValue = document.getElementById('task-due-date').value;
    
    // Convertir fecha a timestamp PostgreSQL compatible
    let dueDateISO = null;
    if (dueDateValue) {
        // dueDateValue es "YYYY-MM-DD"
        // Crear fecha en zona horaria local y convertir a UTC
        const localDate = new Date(dueDateValue + 'T00:00:00');
        localDate.setHours(23, 59, 59, 0);
        dueDateISO = localDate.toISOString();
    }
    
    const taskData = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-description').value.trim() || null,
        subject: document.getElementById('task-subject').value || null,
        dueDate: dueDateISO,
        priority: document.getElementById('task-priority').value
    };
    
    console.log('Saving task with data:', taskData);
    
    try {
        let response;
        
        if (editingTaskId) {
            response = await updateTask(editingTaskId, taskData);
        } else {
            response = await createTask(taskData);
        }
        
        if (response.success) {
            showNotification(editingTaskId ? 'Tarea actualizada' : 'Tarea añadida', 'success');
            closeTaskModal();
            await loadTasks();
            renderQuickView();
        } else {
            showNotification(response.message || 'Error al guardar', 'error');
            console.error('Save task error response:', response);
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showNotification('Error al guardar tarea', 'error');
    }
}

// Editar tarea
function editTask(taskId) {
    openTaskModal(taskId);
}

// Eliminar tarea
async function deleteTaskItem(taskId) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
    
    try {
        const response = await deleteTask(taskId);
        
        if (response.success) {
            showNotification('Tarea eliminada', 'success');
            await loadTasks();
            renderQuickView();
        } else {
            showNotification(response.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error al eliminar tarea', 'error');
    }
}

// Toggle completar tarea
async function toggleTaskCompleteAction(taskId, isCompleted) {
    try {
        const response = await toggleTaskComplete(taskId, isCompleted);
        
        if (response.success) {
            showNotification(isCompleted ? 'Tarea completada ✅' : 'Tarea marcada como pendiente', 'success');
            await loadTasks();
            renderQuickView();
        } else {
            showNotification(response.message || 'Error al actualizar', 'error');
        }
    } catch (error) {
        console.error('Error toggling task:', error);
        showNotification('Error al actualizar tarea', 'error');
    }
}

// Ir al chatbot
function goToChatbot() {
    window.location.href = 'chatbot.html';
}

// Ir al panel de administración de usuarios
function goToAdminUsers() {
    window.location.href = 'admin-users.html';
}

// Cerrar sesión
async function handleLogout() {
    if (!confirm('¿Estás seguro de cerrar sesión?')) return;
    
    try {
        await logout();
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Borrar datos locales de todas formas
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}
