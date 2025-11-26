// Este script maneja el login

document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita que el formulario se envíe de forma tradicional

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
        // 3. Llamar a la API de tokens que creamos
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
            // Si el login falla (401 Unauthorized)
            throw new Error('Login fallido');
        }

        // 4. Si el login es exitoso
        const data = await response.json();
        
        // 5. Guardar los tokens en el almacenamiento local del navegador
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);

        // 6. NUEVO: Obtener datos del usuario actual incluyendo su rol
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
        
        // DEBUG: Verificar datos del usuario
        console.log('Usuario obtenido de /api/me/:', userData);
        console.log('Rol del usuario:', userData.rol);

        // 7. NUEVO: Redireccionar según el rol del usuario
        if (userData.rol === 'Veterinario' || userData.rol === 'Asistente' || userData.rol === 'Administrador') {
            // Usuarios de staff van al dashboard
            console.log('Redirigiendo a dashboard (staff)');
            window.location.href = '/dashboard/';
        } else if (userData.rol === 'Tutor') {
            // Tutores van al portal exclusivo
            console.log('Redirigiendo a portal (tutor)');
            window.location.href = '/portal/';
        } else {
            // Usuario sin rol asignado
            console.log('Rol no reconocido:', userData.rol);
            throw new Error('Usuario sin rol asignado. Contacte al administrador.');
        }

    } catch (error) {
        // 8. Si hay un error, mostrar alerta
        console.error('Error en login:', error);
        errorAlert.classList.remove('d-none');
        errorAlert.textContent = error.message || 'Error en el login';
    } finally {
        // 9. Ocultar spinner y mostrar texto del botón
        btnText.classList.remove('d-none');
        btnSpinner.classList.add('d-none');
    }
});
