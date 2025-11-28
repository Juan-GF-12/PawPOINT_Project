/**
 * registro.js - Lógica de registro para nuevos tutores
 * 
 * Funcionalidad:
 * - Validación de formulario
 * - POST a /api/registro-tutor/
 * - Redirección a login en caso de éxito
 * - Manejo de errores
 */

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-registro');
    const btnSubmit = document.getElementById('btn-submit');
    const mensajeAlert = document.getElementById('mensaje-alert');

    formulario.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validar que las contraseñas coincidan
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        if (password !== passwordConfirm) {
            mostrarError('Las contraseñas no coinciden.');
            return;
        }

        // Obtener datos del formulario
        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            email: document.getElementById('email').value.trim(),
            rut: document.getElementById('rut').value.trim(),
            password: password
        };

        // Validar que no estén vacíos
        if (!datos.nombre || !datos.apellido || !datos.email || !datos.rut || !datos.password) {
            mostrarError('Por favor completa todos los campos.');
            return;
        }

        // Mostrar cargando
        btnSubmit.classList.add('loading');
        btnSubmit.disabled = true;

        try {
            // POST a la API
            const response = await fetch('/api/registro-tutor/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': obtenerCSRFToken()
                },
                body: JSON.stringify(datos)
            });

            const respuesta = await response.json();

            if (response.ok) {
                // Éxito
                mostrarExito('¡Registro exitoso! Redirigiendo a login...');
                setTimeout(() => {
                    window.location.href = '/login/';
                }, 2000);
            } else {
                // Error en la API
                let mensaje = 'Error al registrar.';
                
                if (respuesta.email) {
                    mensaje = respuesta.email[0] || mensaje;
                } else if (respuesta.rut) {
                    mensaje = respuesta.rut[0] || mensaje;
                } else if (respuesta.password) {
                    mensaje = respuesta.password[0] || mensaje;
                } else if (typeof respuesta === 'object') {
                    mensaje = Object.values(respuesta)[0]?.[0] || mensaje;
                }
                
                mostrarError(mensaje);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error de conexión. Intenta nuevamente.');
        } finally {
            btnSubmit.classList.remove('loading');
            btnSubmit.disabled = false;
        }
    });

    /**
     * Muestra un mensaje de error
     */
    function mostrarError(mensaje) {
        mensajeAlert.className = 'alert alert-danger';
        mensajeAlert.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${mensaje}
        `;
        mensajeAlert.style.display = 'block';
        mensajeAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Muestra un mensaje de éxito
     */
    function mostrarExito(mensaje) {
        mensajeAlert.className = 'alert alert-success';
        mensajeAlert.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${mensaje}
        `;
        mensajeAlert.style.display = 'block';
        mensajeAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Obtiene el token CSRF del DOM
     */
    function obtenerCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }
});
