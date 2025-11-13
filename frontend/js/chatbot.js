// Estado global
let messageHistory = [];

// Inicializar chatbot
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    const sessionId = localStorage.getItem('sessionId');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!sessionId || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar historial de mensajes del sessionStorage
    const savedHistory = sessionStorage.getItem('chatHistory');
    if (savedHistory) {
        try {
            messageHistory = JSON.parse(savedHistory);
            renderMessages();
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    // Focus en input
    document.getElementById('message-input').focus();
    
    // Scroll al final
    scrollToBottom();
});

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

// Limpiar historial (opcional - se puede añadir un botón)
function clearHistory() {
    if (confirm('¿Estás seguro de borrar el historial de chat?')) {
        messageHistory = [];
        sessionStorage.removeItem('chatHistory');
        
        const container = document.getElementById('messages-container');
        const messagesToRemove = container.querySelectorAll('.message-wrapper');
        messagesToRemove.forEach(msg => msg.remove());
        
        showNotification('Historial borrado', 'success');
    }
}
