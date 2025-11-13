/* ============================================
   Smart UNI-BOT - Utilidades
   Funciones helper generales
   ============================================ */

/**
 * Formatear fecha a DD/MM/YYYY
 */
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Formatear hora de TIME a HH:MM
 */
function formatTime(time) {
    if (!time) return '';
    
    // Si ya está en formato HH:MM
    if (typeof time === 'string' && time.includes(':')) {
        return time.substring(0, 5);
    }
    
    const t = new Date(`2000-01-01T${time}`);
    const hours = String(t.getHours()).padStart(2, '0');
    const minutes = String(t.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

/**
 * Obtener nombre del día desde número
 * @param {number} dayNumber - 1=Lunes, 7=Domingo
 */
function getDayName(dayNumber) {
    const days = {
        1: 'Lunes',
        2: 'Martes',
        3: 'Miércoles',
        4: 'Jueves',
        5: 'Viernes',
        6: 'Sábado',
        7: 'Domingo'
    };
    
    return days[dayNumber] || '';
}

/**
 * Obtener número del día actual (1-7, 1=Lunes)
 */
function getCurrentDay() {
    const today = new Date();
    let day = today.getDay();
    
    // Convertir de 0-6 (Dom-Sab) a 1-7 (Lun-Dom)
    return day === 0 ? 7 : day;
}

/**
 * Obtener fecha de mañana
 */
function getTomorrowDay() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let day = tomorrow.getDay();
    
    return day === 0 ? 7 : day;
}

/**
 * Mostrar notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - 'success', 'error', 'warning'
 */
function showNotification(message, type = 'success') {
    // Eliminar notificación anterior si existe
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icono según tipo
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || '•'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Mostrar loading overlay
 */
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
}

/**
 * Ocultar loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Validar formato de email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validar longitud de contraseña
 */
function validatePassword(password) {
    return password && password.length >= 8;
}

/**
 * Calcular días hasta una fecha
 */
function daysUntil(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Obtener color de borde según proximidad de fecha
 */
function getTaskBorderColor(dueDate) {
    const days = daysUntil(dueDate);
    
    if (days < 0) return '#D32F2F'; // Atrasada - rojo
    if (days === 0) return '#D32F2F'; // Hoy - rojo
    if (days <= 7) return '#F57C00'; // Esta semana - naranja
    return '#1E6B52'; // Más de una semana - verde
}

/**
 * Obtener texto de urgencia de tarea
 */
function getTaskUrgencyText(dueDate) {
    const days = daysUntil(dueDate);
    
    if (days < 0) return `Atrasada ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`;
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    if (days <= 7) return `Vence en ${days} días`;
    return `Vence en ${days} días`;
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Ordenar clases por hora de inicio
 */
function sortClassesByTime(classes) {
    return classes.sort((a, b) => {
        const timeA = a.startTime.replace(':', '');
        const timeB = b.startTime.replace(':', '');
        return parseInt(timeA) - parseInt(timeB);
    });
}

/**
 * Ordenar tareas por fecha de entrega
 */
function sortTasksByDueDate(tasks) {
    return tasks.sort((a, b) => {
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
}

/**
 * Obtener año y período actual del semestre
 */
function getCurrentSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Septiembre a Febrero = Otoño
    // Marzo a Agosto = Primavera
    const period = (month >= 9 || month <= 2) ? 'Otoño' : 'Primavera';
    
    return { year, period };
}

/**
 * Debounce function para optimizar eventos
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Confirmar acción destructiva
 */
function confirmAction(message) {
    return confirm(message);
}
