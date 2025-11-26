/**
 * Funciones de Validación Reutilizables
 * Para usar en formularios de PawPOINT
 */

/**
 * Valida formato RUT chileno
 * @param {string} rut - RUT a validar (formato: 12345678-9)
 * @returns {boolean} - true si es válido
 */
function validarRUT(rut) {
    const rutRegex = /^[0-9]{7,8}-[0-9kK]{1}$/;
    return rutRegex.test(rut.trim());
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Valida que solo contenga números
 * @param {string} valor - Valor a validar
 * @returns {boolean} - true si solo contiene números
 */
function soloNumeros(valor) {
    return /^[0-9]+$/.test(valor);
}

/**
 * Valida formato de teléfono chileno
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
function validarTelefono(telefono) {
    // Acepta formatos: +56912345678, 912345678, +56 9 1234 5678
    const telefonoRegex = /^[+]?[0-9\s]{8,15}$/;
    return telefonoRegex.test(telefono.trim());
}

/**
 * Valida longitud mínima de texto
 * @param {string} texto - Texto a validar
 * @param {number} min - Longitud mínima
 * @returns {boolean} - true si cumple
 */
function longitudMinima(texto, min) {
    return texto.trim().length >= min;
}

/**
 * Valida longitud máxima de texto
 * @param {string} texto - Texto a validar
 * @param {number} max - Longitud máxima
 * @returns {boolean} - true si cumple
 */
function longitudMaxima(texto, max) {
    return texto.trim().length <= max;
}

/**
 * Valida que dos contraseñas coincidan
 * @param {string} password1 - Primera contraseña
 * @param {string} password2 - Segunda contraseña
 * @returns {boolean} - true si coinciden
 */
function validarPasswordsCoinciden(password1, password2) {
    return password1 === password2;
}

/**
 * Valida fortaleza mínima de contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} - {valido: boolean, mensaje: string}
 */
function validarFortalezaPassword(password) {
    if (password.length < 6) {
        return {
            valido: false,
            mensaje: 'La contraseña debe tener al menos 6 caracteres'
        };
    }
    
    // Opcional: validar que tenga al menos una letra y un número
    const tieneLetra = /[a-zA-Z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    
    if (!tieneLetra || !tieneNumero) {
        return {
            valido: false,
            mensaje: 'La contraseña debe contener letras y números'
        };
    }
    
    return {
        valido: true,
        mensaje: 'Contraseña válida'
    };
}

/**
 * Formatea RUT agregando puntos y guión
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado
 */
function formatearRUT(rut) {
    // Eliminar puntos y guiones existentes
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rut.length < 2) return rut;
    
    // Separar cuerpo y dígito verificador
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1);
    
    // Agregar puntos al cuerpo
    let cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${cuerpoFormateado}-${dv}`;
}

/**
 * Limpia formato de RUT (solo números y guión)
 * @param {string} rut - RUT con formato
 * @returns {string} - RUT limpio
 */
function limpiarRUT(rut) {
    return rut.replace(/\./g, '').trim();
}

/**
 * Muestra mensaje de error en un campo
 * @param {string} inputId - ID del input
 * @param {string} mensaje - Mensaje de error
 */
function mostrarErrorCampo(inputId, mensaje) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Agregar clase de error
    input.classList.add('border-red-500', 'border-2');
    
    // Crear o actualizar mensaje de error
    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('error-mensaje')) {
        errorDiv = document.createElement('p');
        errorDiv.classList.add('error-mensaje', 'text-xs', 'text-red-400', 'mt-1');
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = mensaje;
}

/**
 * Limpia mensaje de error de un campo
 * @param {string} inputId - ID del input
 */
function limpiarErrorCampo(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Remover clase de error
    input.classList.remove('border-red-500', 'border-2');
    
    // Eliminar mensaje de error
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error-mensaje')) {
        errorDiv.remove();
    }
}
