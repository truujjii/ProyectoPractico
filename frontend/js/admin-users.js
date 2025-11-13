/* ============================================
   Smart UNI-BOT - Administración de Usuarios
   ============================================ */

let allUsers = [];

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const sessionId = localStorage.getItem('sessionId');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!sessionId || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar usuarios
    await loadUsers();
});

// Cargar todos los usuarios
async function loadUsers() {
    showLoading();
    
    try {
        const { data, error } = await supabaseClient.auth.admin.listUsers();
        
        if (error) throw error;
        
        allUsers = data.users;
        renderUsersTable();
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error al cargar usuarios: ' + error.message, 'error');
        
        // Si falla la API admin, mostramos mensaje informativo
        document.getElementById('users-container').innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p style="color: #666; margin-bottom: 1rem;">
                    ⚠️ No se pueden cargar los usuarios con la clave actual.
                </p>
                <p style="color: #999; font-size: 0.9rem;">
                    La administración de usuarios requiere permisos de administrador en Supabase.
                </p>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Renderizar tabla de usuarios
function renderUsersTable() {
    const container = document.getElementById('users-container');
    
    if (allUsers.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p style="color: #666;">No hay usuarios registrados</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Fecha de Registro</th>
                    <th>Último Acceso</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    allUsers.forEach(user => {
        const createdAt = new Date(user.created_at).toLocaleDateString('es-ES');
        const lastSignIn = user.last_sign_in_at 
            ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES') 
            : 'Nunca';
        
        const isConfirmed = user.email_confirmed_at ? 'confirmed' : 'active';
        const statusText = user.email_confirmed_at ? '✅ Confirmado' : '⏳ Pendiente';
        
        html += `
            <tr>
                <td>
                    <div class="user-email">${escapeHtml(user.email)}</div>
                    <div class="user-date" style="font-size: 0.8rem; color: #999;">
                        ID: ${user.id.substring(0, 8)}...
                    </div>
                </td>
                <td>
                    <span class="user-status status-${isConfirmed}">${statusText}</span>
                </td>
                <td class="user-date">${createdAt}</td>
                <td class="user-date">${lastSignIn}</td>
                <td>
                    <div class="user-actions">
                        <button class="btn-icon" onclick="viewUserDetails('${user.id}')" title="Ver detalles">
                            👁️
                        </button>
                        <button class="btn-icon" onclick="resetUserPassword('${user.id}')" title="Resetear contraseña">
                            🔑
                        </button>
                        <button class="btn-icon" onclick="deleteUser('${user.id}', '${escapeHtml(user.email)}')" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Ver detalles del usuario
function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const details = `
📧 Email: ${user.email}
🆔 ID: ${user.id}
📅 Registrado: ${new Date(user.created_at).toLocaleString('es-ES')}
🔐 Email confirmado: ${user.email_confirmed_at ? '✅ Sí' : '❌ No'}
👤 Último acceso: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : 'Nunca'}
📱 Teléfono: ${user.phone || 'No especificado'}
    `.trim();
    
    alert(details);
}

// Resetear contraseña
async function resetUserPassword(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const newPassword = prompt(`Ingresa la nueva contraseña para ${user.email}:\n(Mínimo 8 caracteres)`);
    
    if (!newPassword) return;
    
    if (newPassword.length < 8) {
        showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const { error } = await supabaseClient.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );
        
        if (error) throw error;
        
        showNotification('Contraseña actualizada correctamente', 'success');
    } catch (error) {
        console.error('Error resetting password:', error);
        showNotification('Error al resetear contraseña: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Eliminar usuario
async function deleteUser(userId, userEmail) {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar al usuario ${userEmail}?\n\nEsta acción no se puede deshacer y eliminará todos sus datos.`)) {
        return;
    }
    
    try {
        showLoading();
        
        const { error } = await supabaseClient.auth.admin.deleteUser(userId);
        
        if (error) throw error;
        
        showNotification('Usuario eliminado correctamente', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error al eliminar usuario: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Actualizar lista
async function refreshUsers() {
    await loadUsers();
    showNotification('Lista actualizada', 'success');
}

// Cerrar sesión
async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}
