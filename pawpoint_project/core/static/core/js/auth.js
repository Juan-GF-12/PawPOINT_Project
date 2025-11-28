// ============================================================================
// AUTH.JS - Autenticación y Control de Navegación basado en Roles
// ============================================================================

document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    // 1. Obtener elementos del DOM
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorAlert = document.getElementById('alert-error');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    // 2. Ocultar errores previos y mostrar spinner
    errorAlert.classList.add('d-none');
    btnText.classList.add('d-none');
    btnSpinner.classList.remove('d-none');

    try {
        // 3. Llamar a la API de tokens
        const response = await fetch('/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error('Credenciales incorrectas');
        }

        // 4. Si el login es exitoso
        const data = await response.json();
        
        // 5. Guardar los tokens en localStorage
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);

        // 6. Obtener datos del usuario actual incluyendo su rol
        const meResponse = await fetch('/api/me/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.access}`
            }
        });

        if (!meResponse.ok) {
            throw new Error('No se pudo obtener información del usuario');
        }

        const userData = await meResponse.json();
        
        // 7. Guardar rol en localStorage para navegación futura
        localStorage.setItem('userRole', userData.rol);
        
        // 8. REDIRECCIÓN BASADA EN ROL
        redirectBasedOnRole(userData.rol);

    } catch (error) {
        console.error('Error en login:', error);
        errorAlert.classList.remove('d-none');
        errorAlert.textContent = error.message || 'Error en el login';
    } finally {
        btnText.classList.remove('d-none');
        btnSpinner.classList.add('d-none');
    }
});

// ============================================================================
// FUNCIONES DE NAVEGACIÓN Y GUARDIAS
// ============================================================================

/**
 * Redirige al usuario según su rol
 * @param {string} rol - Rol del usuario ('Tutor', 'Veterinario', 'Asistente', 'Administrador')
 */
function redirectBasedOnRole(rol) {
    if (['Veterinario', 'Asistente', 'Administrador'].includes(rol)) {
        // Personal staff → Dashboard
        window.location.href = '/dashboard/';
    } else if (rol === 'Tutor') {
        // Tutores → Portal
        window.location.href = '/portal/';
    } else {
        // Rol no reconocido
        throw new Error('Usuario sin rol asignado. Contacte al administrador.');
    }
}

/**
 * Verifica que el usuario tenga acceso a la página actual
 * Debe llamarse en cada página protegida
 */
function checkPageAccess() {
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    const currentPath = window.location.pathname;
    
    // Si no hay token, redirigir a login
    if (!token) {
        if (currentPath !== '/login/' && currentPath !== '/registro/') {
            window.location.href = '/login/';
        }
        return;
    }
    
    // Si no hay rol guardado, verificar con el servidor
    if (!userRole) {
        verifyRoleFromServer();
        return;
    }
    
    // GUARDIAS DE NAVEGACIÓN POR ROL
    const staffPages = ['/dashboard/', '/pacientes/', '/citas/', '/gestion-clinica/', '/tutores/'];
    const tutorPages = ['/portal/'];
    
    const isStaffPage = staffPages.some(page => currentPath.startsWith(page));
    const isTutorPage = tutorPages.some(page => currentPath.startsWith(page));
    const isStaffRole = ['Veterinario', 'Asistente', 'Administrador'].includes(userRole);
    
    // Si un tutor intenta acceder a página de staff
    if (isStaffPage && userRole === 'Tutor') {
        window.location.href = '/portal/';
        return;
    }
    
    // Si staff intenta acceder a página de tutor
    if (isTutorPage && isStaffRole) {
        window.location.href = '/dashboard/';
        return;
    }
}

/**
 * Verifica el rol del usuario con el servidor
 */
async function verifyRoleFromServer() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        window.location.href = '/login/';
        return;
    }
    
    try {
        const response = await fetch('/api/me/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token inválido');
        }
        
        const userData = await response.json();
        localStorage.setItem('userRole', userData.rol);
        
        // Verificar acceso nuevamente ahora que tenemos el rol
        checkPageAccess();
        
    } catch (error) {
        console.error('Error verificando rol:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login/';
    }
}

// ============================================================================
// EJECUTAR VERIFICACIÓN AL CARGAR PÁGINA
// ============================================================================

// Solo ejecutar si NO estamos en páginas públicas
const publicPages = ['/login/', '/registro/', '/'];
const currentPath = window.location.pathname;

if (!publicPages.includes(currentPath)) {
    checkPageAccess();
}
