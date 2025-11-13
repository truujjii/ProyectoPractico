/* ============================================
   Smart UNI-BOT - Administración de Usuarios
   ============================================ */

let allUsers = [];

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const sessionId = localStorage.getItem('sessionId');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userRole = localStorage.getItem('userRole');
    
    if (!sessionId || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verificar que el usuario es admin - SIMPLE
    if (userRole !== 'admin') {
        alert('⛔ No tienes permisos para acceder a esta página');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Cargar usuarios
    await loadUsers();
});

// Cargar todos los usuarios
async function loadUsers() {
    showLoading();
    
    try {
        // Obtener todos los usuarios con sus roles Y emails desde la vista
        const { data, error } = await supabaseClient
            .from('users_with_roles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allUsers = data.map(user => ({
            id: user.user_id,
            email: user.email,
            role: user.role,
            created_at: user.user_created_at || user.created_at,
            last_sign_in_at: user.last_sign_in_at
        }));
        
        renderUsersTable();
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error al cargar usuarios: ' + error.message, 'error');
        
        document.getElementById('users-container').innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <p style="color: #666; margin-bottom: 1rem;">
                    ⚠️ No se pueden cargar los usuarios.
                </p>
                <p style="color: #999; font-size: 0.9rem;">
                    Error: ${error.message}
                </p>
                <p style="color: #999; font-size: 0.9rem; margin-top: 1rem;">
                    Asegúrate de haber ejecutado el script SQL para crear la vista <code>users_with_roles</code>
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
                    <th>Rol</th>
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
        const roleClass = user.role === 'admin' ? 'confirmed' : 'active';
        const roleIcon = user.role === 'admin' ? '👑' : '👤';
        
        html += `
            <tr>
                <td>
                    <div class="user-email">${escapeHtml(user.email || 'Sin email')}</div>
                    <div class="user-date" style="font-size: 0.8rem; color: #999;">
                        ID: ${user.id.substring(0, 8)}...
                    </div>
                </td>
                <td>
                    <span class="user-status status-${roleClass}">${roleIcon} ${user.role}</span>
                </td>
                <td class="user-date">${createdAt}</td>
                <td class="user-date">${lastSignIn}</td>
                <td>
                    <div class="user-actions">
                        ${user.role !== 'admin' ? `
                            <button class="btn-icon" onclick="promoteToAdmin('${user.id}', '${escapeHtml(user.email)}')" title="Promover a Admin">
                                👑
                            </button>
                            <button class="btn-icon" onclick="deleteUserRole('${user.id}', '${escapeHtml(user.email)}')" title="Eliminar usuario">
                                🗑️
                            </button>
                        ` : `
                            <span style="color: #999; font-size: 0.9rem;">Administrador principal</span>
                        `}
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

// Promover usuario a admin
async function promoteToAdmin(userId, userEmail) {
    if (!confirm(`¿Promover a ${userEmail} a administrador?\n\nTendrá acceso completo al panel de administración.`)) {
        return;
    }
    
    try {
        showLoading();
        
        const { error } = await supabaseClient
            .from('user_roles')
            .update({ role: 'admin' })
            .eq('user_id', userId);
        
        if (error) throw error;
        
        showNotification('Usuario promovido a administrador', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Error promoting user:', error);
        showNotification('Error al promover usuario: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Eliminar usuario
async function deleteUserRole(userId, userEmail) {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar al usuario ${userEmail}?\n\nSe eliminarán todos sus datos (clases, tareas, etc.)`)) {
        return;
    }
    
    try {
        showLoading();
        
        // Eliminar tareas del usuario
        await supabaseClient
            .from('tasks')
            .delete()
            .eq('user_id', userId);
        
        // Eliminar clases del usuario
        await supabaseClient
            .from('classes')
            .delete()
            .eq('user_id', userId);
        
        // Eliminar rol del usuario
        const { error } = await supabaseClient
            .from('user_roles')
            .delete()
            .eq('user_id', userId);
        
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
