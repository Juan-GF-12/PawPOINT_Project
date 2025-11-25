/**
 * CALENDARIO DE CITAS CON FULLCALENDAR
 * 
 * Este módulo gestiona la interfaz de calendario para visualizar, crear, editar y eliminar citas.
 * Utiliza FullCalendar v6 para la visualización del calendario e incluye:
 * - Autenticación JWT
 * - Validación de solapamientos
 * - Gestión CRUD de citas
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================
let calendar = null;
let citaActualId = null;
const modal = new bootstrap.Modal(document.getElementById('modalCita'));

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

/**
 * Obtiene los headers necesarios para autenticación JWT.
 * Si no hay token disponible, redirige al usuario a la página de login.
 * 
 * @returns {Object|null} Headers con autenticación o null si no hay token
 */
function getHeaders() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login/';
        return null;
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ============================================================================
// INICIALIZACIÓN DEL CALENDARIO
// ============================================================================

/**
 * Inicializa la instancia de FullCalendar con configuración personalizada.
 * 
 * Se configura con:
 * - Vista inicial: Semana con horas (timeGridWeek)
 * - Idioma: Español
 * - Carga dinámica de eventos desde la API
 * - Interactividad: clicks en fechas y eventos
 */
function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'es',
        height: 'auto',
        slotDuration: '00:30:00',
        slotLabelInterval: '00:30:00',
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        
        // Se cargan los eventos dinámicamente desde la API
        events: function(info, successCallback, failureCallback) {
            cargarCitasDelAPI(successCallback, failureCallback);
        },
        
        // Abre modal para crear cita al hacer click en una fecha vacía
        dateClick: function(info) {
            abrirModalNuevaCita(info.dateStr);
        },
        
        // Abre modal con datos de cita al hacer click en un evento
        eventClick: function(info) {
            abrirModalEditarCita(info.event.id);
        }
    });
    
    calendar.render();
}

// ============================================================================
// CARGA DE DATOS DESDE API
// ============================================================================

/**
 * Carga las citas desde la API y las transforma en eventos de FullCalendar.
 * 
 * Mapeo de datos:
 * - title: Nombre del paciente + nombre del veterinario
 * - start: Fecha y hora de la cita
 * - id: Identificador único
 * - className: Clase CSS según estado de la cita
 *
 * @param {Function} successCallback - Callback cuando se cargan éxitosamente
 * @param {Function} failureCallback - Callback en caso de error
 */
function cargarCitasDelAPI(successCallback, failureCallback) {
    fetch('/api/citas/', {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(data => {
        const eventos = data.map(cita => {
            return {
                id: cita.id,
                title: `${cita.paciente_nombre || 'Paciente'} - ${cita.veterinario_nombre || 'Vet.'}`,
                start: cita.fecha_hora,
                className: `estado-${cita.estado.toLowerCase()}`
            };
        });
        successCallback(eventos);
    })
    .catch(error => {
        console.error('Error cargando citas:', error);
        failureCallback(error);
    });
}

/**
 * Carga los veterinarios disponibles en el select del modal.
 * Se obtiene del endpoint /api/tutores/
 */
function cargarVeterinarios() {
    fetch('/api/veterinarios/', {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('cita-veterinario');
        select.innerHTML = '<option value="">Seleccionar veterinario...</option>';
        
        data.forEach(vet => {
            const option = document.createElement('option');
            option.value = vet.id;
            option.textContent = vet.nombre || vet.email;
            select.appendChild(option);
        });
    })
    .catch(error => console.error('Error cargando veterinarios:', error));
}

/**
 * Carga los pacientes disponibles en el select del modal.
 * Se obtiene del endpoint /api/pacientes/
 */
function cargarPacientes() {
    fetch('/api/pacientes/', {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('cita-paciente');
        select.innerHTML = '<option value="">Seleccionar paciente...</option>';
        
        data.forEach(paciente => {
            const option = document.createElement('option');
            option.value = paciente.id;
            option.textContent = `${paciente.nombre} (${paciente.especie})`;
            select.appendChild(option);
        });
    })
    .catch(error => console.error('Error cargando pacientes:', error));
}

// ============================================================================
// GESTIÓN DEL MODAL
// ============================================================================

/**
 * Abre el modal para crear una nueva cita.
 * Si se pasa una fecha, se pre-llena el campo de fecha/hora.
 *
 * @param {string} fechaSeleccionada - Fecha en formato ISO (opcional)
 */
function abrirModalNuevaCita(fechaSeleccionada = null) {
    citaActualId = null;
    document.getElementById('modalTitulo').textContent = 'Nueva Cita';
    document.getElementById('btnEliminar').classList.add('d-none');
    document.getElementById('modal-error').classList.add('d-none');
    document.getElementById('formCita').reset();
    
    // Pre-llenar fecha si se hizo click en el calendario
    if (fechaSeleccionada) {
        document.getElementById('cita-fecha').value = fechaSeleccionada;
    }
    
    modal.show();
}

/**
 * Abre el modal para editar una cita existente.
 * Carga los datos de la cita y los inyecta en el formulario.
 *
 * @param {number} citaId - Identificador único de la cita
 */
function abrirModalEditarCita(citaId) {
    citaActualId = citaId;
    
    fetch(`/api/citas/${citaId}/`, {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(cita => {
        document.getElementById('modalTitulo').textContent = 'Detalle de Cita';
        document.getElementById('btnEliminar').classList.remove('d-none');
        document.getElementById('modal-error').classList.add('d-none');
        
        // Se llenan los campos del formulario con datos de la cita
        document.getElementById('cita-veterinario').value = cita.veterinario || '';
        document.getElementById('cita-paciente').value = cita.paciente || '';
        document.getElementById('cita-fecha').value = cita.fecha_hora.replace('Z', '').slice(0, 16);
        document.getElementById('cita-motivo').value = cita.motivo || '';
        document.getElementById('cita-estado').value = cita.estado;
        
        modal.show();
    })
    .catch(error => {
        console.error('Error cargando cita:', error);
        mostrarError('Error al cargar la cita');
    });
}

// ============================================================================
// OPERACIONES CRUD
// ============================================================================

/**
 * Guarda una cita (crear o actualizar).
 * 
 * Si el servidor retorna error 400, se captura el mensaje de validación
 * y se muestra en el modal sin cerrarlo (para que el usuario pueda corregir).
 * 
 * En caso de éxito, se actualiza el calendario y se cierra el modal.
 */
function guardarCita() {
    const formData = {
        veterinario: document.getElementById('cita-veterinario').value,
        paciente: document.getElementById('cita-paciente').value,
        fecha_hora: document.getElementById('cita-fecha').value,
        motivo: document.getElementById('cita-motivo').value,
        estado: document.getElementById('cita-estado').value
    };
    
    // Se convierte la fecha a formato ISO compatible con Django
    formData.fecha_hora = new Date(formData.fecha_hora).toISOString();
    
    // Se determina si es crear (POST) o actualizar (PUT)
    const url = citaActualId ? `/api/citas/${citaActualId}/` : '/api/citas/';
    const metodo = citaActualId ? 'PUT' : 'POST';
    
    fetch(url, {
        method: metodo,
        headers: getHeaders(),
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            modal.hide();
            calendar.refetchEvents();
            mostrarExito('Cita guardada correctamente');
        } else if (response.status === 400) {
            // Se captura el error de validación y se muestra en el modal
            return response.json().then(data => {
                mostrarErrorModal(data);
            });
        } else {
            throw new Error('Error desconocido');
        }
    })
    .catch(error => {
        console.error('Error guardando cita:', error);
        mostrarErrorModal({ detail: 'Error al guardar la cita' });
    });
}

/**
 * Elimina una cita con confirmación del usuario.
 * Envía petición DELETE a la API y actualiza el calendario.
 */
function eliminarCita() {
    if (!citaActualId || !confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
        return;
    }
    
    fetch(`/api/citas/${citaActualId}/`, {
        method: 'DELETE',
        headers: getHeaders()
    })
    .then(response => {
        if (response.ok) {
            modal.hide();
            calendar.refetchEvents();
            mostrarExito('Cita eliminada correctamente');
        } else {
            mostrarError('Error al eliminar la cita');
        }
    })
    .catch(error => {
        console.error('Error eliminando cita:', error);
        mostrarError('Error al eliminar la cita');
    });
}

// ============================================================================
// FUNCIONES DE NOTIFICACIÓN
// ============================================================================

/**
 * Muestra un mensaje de error dentro del modal (sin cerrarlo).
 * Extrae el mensaje del objeto de error del servidor.
 *
 * @param {Object} data - Objeto con información del error
 */
function mostrarErrorModal(data) {
    const errorDiv = document.getElementById('modal-error');
    let mensaje = 'Error al guardar la cita';
    
    // Se intenta extraer el mensaje del error
    if (data.detail) {
        mensaje = data.detail;
    } else if (data.non_field_errors && data.non_field_errors.length > 0) {
        mensaje = data.non_field_errors[0];
    } else if (typeof data === 'string') {
        mensaje = data;
    }
    
    errorDiv.textContent = mensaje;
    errorDiv.classList.remove('d-none');
}

/**
 * Muestra un mensaje de error temporal fuera del modal.
 * La alerta desaparece automáticamente después de 5 segundos.
 *
 * @param {string} mensaje - Texto del mensaje de error
 */
function mostrarError(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger alert-dismissible fade show';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').insertBefore(alerta, document.querySelector('.card'));
    
    setTimeout(() => alerta.remove(), 5000);
}

/**
 * Muestra un mensaje de éxito temporal.
 * La alerta desaparece automáticamente después de 5 segundos.
 *
 * @param {string} mensaje - Texto del mensaje de éxito
 */
function mostrarExito(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').insertBefore(alerta, document.querySelector('.card'));
    
    setTimeout(() => alerta.remove(), 5000);
}

// ============================================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ============================================================================

/**
 * Se ejecuta cuando el DOM está completamente cargado.
 * Inicializa el calendario y carga los datos de veterinarios y pacientes.
 */
document.addEventListener('DOMContentLoaded', function() {
    inicializarCalendario();
    cargarVeterinarios();
    cargarPacientes();
});
