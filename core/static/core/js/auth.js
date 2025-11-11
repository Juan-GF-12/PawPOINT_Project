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

        // 6. Redirigir al dashboard
        window.location.href = '/dashboard/'; // Iremos a la URL del dashboard

    } catch (error) {
        // 7. Si hay un error, mostrar alerta
        errorAlert.classList.remove('d-none');
    } finally {
        // 8. Ocultar spinner y mostrar texto del botón
        btnText.classList.remove('d-none');
        btnSpinner.classList.add('d-none');
    }
});
