/* ============================================
   Smart UNI-BOT - Autenticación
   Manejo de login y registro
   ============================================ */

// Cambiar entre tabs de login y registro
function switchTab(tab) {
    // Actualizar tabs activos
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('login-tab').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('register-tab').classList.add('active');
    }
}

// Manejo del formulario de login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validación básica
    if (!validateEmail(email)) {
        showNotification('Email inválido', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await login(email, password);
        
        if (response.success) {
            showNotification('¡Login exitoso! Redirigiendo...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showNotification(response.message || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Error al iniciar sesión. Verifica tus credenciales.', 'error');
    } finally {
        hideLoading();
    }
});

// Manejo del formulario de registro
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const firstName = document.getElementById('register-firstname').value.trim();
    const lastName = document.getElementById('register-lastname').value.trim();
    
    // Limpiar errores previos
    document.getElementById('password-error').textContent = '';
    document.getElementById('password-confirm-error').textContent = '';
    
    // Validación
    let hasError = false;
    
    if (!validateEmail(email)) {
        showNotification('Email inválido', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        document.getElementById('password-error').textContent = 'Mínimo 8 caracteres';
        hasError = true;
    }
    
    if (password !== passwordConfirm) {
        document.getElementById('password-confirm-error').textContent = 'Las contraseñas no coinciden';
        hasError = true;
    }
    
    if (hasError) {
        showNotification('Por favor, corrige los errores del formulario', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await register(email, password, firstName, lastName);
        
        if (response.success) {
            // Si hay sesión, el usuario ya está logueado automáticamente
            if (response.data.session) {
                showNotification('¡Cuenta creada! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Fallback: mostrar mensaje para iniciar sesión
                showNotification('¡Cuenta creada! Ahora puedes iniciar sesión', 'success');
                setTimeout(() => {
                    switchTab('login');
                    document.getElementById('login-email').value = email;
                    document.getElementById('register-form').reset();
                }, 2000);
            }
        } else {
            showNotification(response.message || 'Error al crear cuenta', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Error al crear cuenta. El email podría estar en uso.', 'error');
    } finally {
        hideLoading();
    }
});

// Validación en tiempo real de contraseñas
document.getElementById('register-password').addEventListener('input', function() {
    const error = document.getElementById('password-error');
    if (this.value.length > 0 && this.value.length < 8) {
        error.textContent = 'Mínimo 8 caracteres';
    } else {
        error.textContent = '';
    }
});

document.getElementById('register-password-confirm').addEventListener('input', function() {
    const password = document.getElementById('register-password').value;
    const error = document.getElementById('password-confirm-error');
    
    if (this.value.length > 0 && this.value !== password) {
        error.textContent = 'Las contraseñas no coinciden';
    } else {
        error.textContent = '';
    }
});

// Verificar si ya hay sesión activa
if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
}
