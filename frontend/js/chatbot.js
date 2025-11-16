// Estado global
let messageHistory = [];
let currentSchedule = [];
let currentTasks = [];

// Inicializar chatbot
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const sessionId = localStorage.getItem('sessionId');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!sessionId || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar datos del usuario
    await loadUserData();
    
    // BORRAR historial automáticamente al entrar
    sessionStorage.removeItem('chatHistory');
    messageHistory = [];
    
    // Scroll al final
    scrollToBottom();
});

// Cargar datos del usuario
async function loadUserData() {
    try {
        // Cargar horario
        const scheduleResponse = await getSchedule();
        if (scheduleResponse.success) {
            currentSchedule = (scheduleResponse.data.classes || []).map(c => ({
                classId: c.id,
                subjectName: c.subject_name,
                dayOfWeek: c.day_of_week,
                startTime: c.start_time,
                endTime: c.end_time,
                location: c.location,
                professor: c.professor
            }));
        }
        
        // Cargar tareas
        const tasksResponse = await getTasks();
        if (tasksResponse.success) {
            currentTasks = (tasksResponse.data.tasks || []).map(t => ({
                taskId: t.id,
                title: t.title,
                description: t.description,
                subject: t.subject,
                dueDate: t.due_date,
                priority: t.priority,
                isCompleted: t.is_completed
            }));
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Manejar pregunta predefinida
async function handleQuestion(questionType) {
    // Mostrar pregunta del usuario
    const questions = {
        'proxima-clase': '¿Cuándo es mi próxima clase?',
        'tareas-pendientes': '¿Qué tareas tengo pendientes?',
        'clases-hoy': '¿Qué clases tengo hoy?',
        'horario-completo': 'Ver mi horario completo',
        'tareas-completadas': '¿Cuántas tareas he completado?'
    };
    
    addMessage(questions[questionType], true);
    
    // Mostrar indicador de escritura
    const typingIndicator = showTypingIndicator();
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Remover indicador
    typingIndicator.remove();
    
    // Generar respuesta
    const response = generateResponse(questionType);
    addMessage(response, false);
}

// Generar respuesta basada en datos reales
function generateResponse(questionType) {
    switch (questionType) {
        case 'proxima-clase':
            return getNextClassResponse();
        
        case 'tareas-pendientes':
            return getPendingTasksResponse();
        
        case 'clases-hoy':
            return getTodayClassesResponse();
        
        case 'horario-completo':
            return getFullScheduleResponse();
        
        case 'tareas-completadas':
            return getCompletedTasksResponse();
        
        default:
            return 'Lo siento, no entendí tu pregunta. 😕';
    }
}

// Respuesta: próxima clase
function getNextClassResponse() {
    if (currentSchedule.length === 0) {
        return '📚 No tienes clases programadas en tu horario.';
    }
    
    const jsDay = new Date().getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const today = jsDay === 0 ? 7 : jsDay; // Convertir a 1=Lunes, ..., 7=Domingo
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Primero buscar si hay una clase en curso ahora mismo
    const ongoingClass = currentSchedule.find(c => 
        c.dayOfWeek === today && 
        c.startTime <= currentTime && 
        c.endTime > currentTime
    );
    
    if (ongoingClass) {
        return `📚 Tienes clase AHORA:\n\n${ongoingClass.subjectName}\n⏰ ${ongoingClass.startTime} - ${ongoingClass.endTime}\n📍 ${ongoingClass.location}\n👨‍🏫 ${ongoingClass.professor}`;
    }
    
    // Buscar clases de hoy que aún no han empezado
    const todayClasses = currentSchedule
        .filter(c => c.dayOfWeek === today && c.startTime > currentTime)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    if (todayClasses.length > 0) {
        const nextClass = todayClasses[0];
        return `📚 Tu próxima clase es:\n\n${nextClass.subjectName}\n⏰ ${nextClass.startTime} - ${nextClass.endTime}\n📍 ${nextClass.location}\n👨‍🏫 ${nextClass.professor}`;
    }
    
    // Buscar en los próximos días (hasta 7 días después)
    const dayNames = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    for (let i = 1; i <= 7; i++) {
        const nextDay = ((today + i - 1) % 7) + 1; // Rotar días: 1-7
        const dayClasses = currentSchedule
            .filter(c => c.dayOfWeek === nextDay)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (dayClasses.length > 0) {
            const nextClass = dayClasses[0];
            const dayLabel = i === 1 ? 'mañana' : dayNames[nextDay];
            
            if (i === 1) {
                return `📚 No tienes más clases hoy.\n\nTu próxima clase es mañana:\n\n${nextClass.subjectName}\n⏰ ${nextClass.startTime} - ${nextClass.endTime}\n📍 ${nextClass.location}\n👨‍🏫 ${nextClass.professor}`;
            } else {
                return `📚 No tienes más clases hoy.\n\nTu próxima clase es el ${dayLabel}:\n\n${nextClass.subjectName}\n⏰ ${nextClass.startTime} - ${nextClass.endTime}\n📍 ${nextClass.location}\n👨‍🏫 ${nextClass.professor}`;
            }
        }
    }
    
    return '📚 No tienes clases programadas próximamente.';
}

// Respuesta: tareas pendientes
function getPendingTasksResponse() {
    const pendingTasks = currentTasks.filter(t => !t.isCompleted);
    
    if (pendingTasks.length === 0) {
        return '🎉 ¡Genial! No tienes tareas pendientes.';
    }
    
    let response = `📝 Tienes ${pendingTasks.length} tarea${pendingTasks.length !== 1 ? 's' : ''} pendiente${pendingTasks.length !== 1 ? 's' : ''}:\n\n`;
    
    pendingTasks.slice(0, 5).forEach((task, index) => {
        response += `${index + 1}. ${task.title}\n`;
        if (task.subject) response += `   📚 ${task.subject}\n`;
        if (task.dueDate) response += `   📅 ${formatDate(task.dueDate)}\n`;
        response += '\n';
    });
    
    if (pendingTasks.length > 5) {
        response += `... y ${pendingTasks.length - 5} más.`;
    }
    
    return response.trim();
}

// Respuesta: clases de hoy
function getTodayClassesResponse() {
    const jsDay = new Date().getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    const today = jsDay === 0 ? 7 : jsDay; // Convertir a 1=Lunes, ..., 7=Domingo
    const todayClasses = currentSchedule
        .filter(c => c.dayOfWeek === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    if (todayClasses.length === 0) {
        return '🎉 ¡No tienes clases hoy! Día libre para estudiar o descansar.';
    }
    
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let response = `📅 Clases de ${dayNames[today - 1]}:\n\n`;
    
    todayClasses.forEach((clase, index) => {
        response += `${index + 1}. ${clase.subjectName}\n`;
        response += `   ⏰ ${clase.startTime} - ${clase.endTime}\n`;
        response += `   📍 ${clase.location}\n`;
        response += `   👨‍🏫 ${clase.professor}\n\n`;
    });
    
    return response.trim();
}

// Respuesta: horario completo
function getFullScheduleResponse() {
    if (currentSchedule.length === 0) {
        return '📊 No tienes clases programadas en tu horario.';
    }
    
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let response = '📊 Tu horario completo:\n\n';
    
    // Agrupar por día
    const byDay = {};
    currentSchedule.forEach(clase => {
        if (!byDay[clase.dayOfWeek]) byDay[clase.dayOfWeek] = [];
        byDay[clase.dayOfWeek].push(clase);
    });
    
    // Mostrar cada día (ordenados 1-7: Lunes-Domingo)
    Object.keys(byDay).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
        response += `📅 ${dayNames[day - 1]}:\n`;
        byDay[day]
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .forEach(clase => {
                response += `  • ${clase.subjectName} (${clase.startTime}-${clase.endTime})\n`;
            });
        response += '\n';
    });
    
    return response.trim();
}

// Respuesta: tareas completadas
function getCompletedTasksResponse() {
    const completedTasks = currentTasks.filter(t => t.isCompleted);
    const totalTasks = currentTasks.length;
    
    if (totalTasks === 0) {
        return '📝 Aún no tienes tareas registradas.';
    }
    
    const percentage = Math.round((completedTasks.length / totalTasks) * 100);
    
    let response = `✅ Has completado ${completedTasks.length} de ${totalTasks} tareas (${percentage}%).\n\n`;
    
    if (completedTasks.length > 0) {
        response += 'Últimas tareas completadas:\n\n';
        completedTasks.slice(-3).reverse().forEach((task, index) => {
            response += `${index + 1}. ${task.title}\n`;
            if (task.subject) response += `   📚 ${task.subject}\n`;
        });
    }
    
    if (percentage === 100) {
        response += '\n🎉 ¡Excelente! Has completado todas tus tareas.';
    } else if (percentage >= 70) {
        response += '\n👍 ¡Muy buen progreso! Sigue así.';
    } else if (percentage >= 30) {
        response += '\n💪 Vas por buen camino, ¡ánimo!';
    } else {
        response += '\n🚀 ¡Empieza a tachar esas tareas!';
    }
    
    return response;
}

// Renderizar todos los mensajes
function renderMessages() {
    const container = document.getElementById('messages-container');
    
    // Mantener el mensaje de bienvenida
    const welcomeMessage = container.querySelector('.welcome-message');
    
    // Limpiar mensajes antiguos (excepto bienvenida)
    const oldMessages = container.querySelectorAll('.message-wrapper');
    oldMessages.forEach(msg => msg.remove());
    
    // Renderizar cada mensaje del historial
    messageHistory.forEach(msg => {
        const messageElement = createMessageElement(msg.text, msg.isUser);
        container.appendChild(messageElement);
    });
    
    scrollToBottom();
}

// Crear elemento de mensaje
function createMessageElement(text, isUser) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isUser ? 'user-wrapper' : 'bot-wrapper'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isUser ? 'user-message' : 'bot-message'}`;
    
    // Preservar saltos de línea y formato
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        if (index > 0) bubble.appendChild(document.createElement('br'));
        const textNode = document.createTextNode(line);
        bubble.appendChild(textNode);
    });
    
    if (!isUser) {
        const avatar = document.createElement('div');
        avatar.className = 'bot-avatar';
        avatar.textContent = '🤖';
        wrapper.appendChild(avatar);
    }
    
    wrapper.appendChild(bubble);
    
    return wrapper;
}

// Enviar mensaje
async function sendMessage(event) {
    event.preventDefault();
    
    const input = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Limpiar input y deshabilitar
    input.value = '';
    input.disabled = true;
    sendButton.disabled = true;
    
    // Añadir mensaje del usuario
    addMessage(message, true);
    
    // Mostrar indicador de escritura
    const typingIndicator = showTypingIndicator();
    
    try {
        // Enviar a la API
        const response = await queryChatbot(message);
        
        // Remover indicador de escritura
        typingIndicator.remove();
        
        if (response.success && response.data.response) {
            // Añadir respuesta del bot
            addMessage(response.data.response, false);
        } else {
            addMessage('Lo siento, hubo un error al procesar tu mensaje. 😔', false);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        typingIndicator.remove();
        addMessage('Lo siento, no puedo responder en este momento. Por favor, intenta más tarde.', false);
    } finally {
        // Rehabilitar input
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
    }
}

// Añadir mensaje al historial y renderizar
function addMessage(text, isUser) {
    const message = { text, isUser, timestamp: new Date().toISOString() };
    messageHistory.push(message);
    
    // Guardar en sessionStorage
    try {
        sessionStorage.setItem('chatHistory', JSON.stringify(messageHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
    
    // Renderizar el nuevo mensaje
    const container = document.getElementById('messages-container');
    const messageElement = createMessageElement(text, isUser);
    container.appendChild(messageElement);
    
    scrollToBottom();
}

// Mostrar indicador de escritura
function showTypingIndicator() {
    const container = document.getElementById('messages-container');
    
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot-wrapper typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.textContent = '🤖';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble bot-message typing';
    bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    
    scrollToBottom();
    
    return wrapper;
}

// Pregunta rápida
function quickQuestion(question) {
    const input = document.getElementById('message-input');
    input.value = question;
    input.focus();
}

// Scroll al final
function scrollToBottom() {
    const container = document.getElementById('messages-container');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Volver al dashboard
function goBack() {
    window.location.href = 'dashboard.html';
}

// Reiniciar chat (botón manual)
function resetChat() {
    messageHistory = [];
    sessionStorage.removeItem('chatHistory');
    
    const container = document.getElementById('messages-container');
    const messagesToRemove = container.querySelectorAll('.message-wrapper');
    messagesToRemove.forEach(msg => msg.remove());
    
    scrollToBottom();
    showNotification('Conversación reiniciada', 'success');
}

// Manejar tecla Enter en el input
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
    }
}

// Manejar envío de mensaje desde el input de texto libre
async function handleSendMessage() {
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Limpiar input y deshabilitar
    input.value = '';
    input.disabled = true;
    sendButton.disabled = true;
    
    // Añadir mensaje del usuario
    addMessage(message, true);
    
    // Mostrar indicador de escritura
    const typingIndicator = showTypingIndicator();
    
    try {
        // Enviar a la API (IA real con Gemini)
        const response = await queryChatbot(message);
        
        // Remover indicador de escritura
        typingIndicator.remove();
        
        if (response.success && response.data.response) {
            // Añadir respuesta del bot
            addMessage(response.data.response, false);
        } else {
            addMessage('Lo siento, hubo un error al procesar tu mensaje. 😔', false);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        typingIndicator.remove();
        addMessage('Lo siento, no puedo responder en este momento. Por favor, intenta más tarde.', false);
    } finally {
        // Rehabilitar input
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
    }
}
