/**
 * CALENDARIO DE CITAS CON FULLCALENDAR
 * 
 * Este módulo gestiona la interfaz de calendario para visualizar, crear, editar y eliminar citas.
 * Utiliza FullCalendar v6 para la visualización del calendario e incluye:
 * - Autenticación JWT
 * - Validación de solapamientos
 * - Gestión CRUD de citas
 * - Filtros por estado y veterinario
 * - Vista alternativa de lista
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================
let calendar = null;
let citaActualId = null;
let todasLasCitas = []; // Almacena todas las citas para filtrado
let filtroEstado = '';
let filtroVeterinario = '';

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
        todasLasCitas = data; // Guardar todas las citas para filtrado
        console.log('Citas cargadas:', data.length); // Debug
        const citasFiltradas = aplicarFiltros(data);
        
        const eventos = citasFiltradas.map(cita => {
            return {
                id: cita.id,
                title: `${cita.paciente_nombre || 'Paciente'} - ${cita.veterinario_nombre || 'Vet.'}`,
                start: cita.fecha_hora,
                className: `estado-${cita.estado.toLowerCase()}`,
                extendedProps: {
                    veterinario: cita.veterinario,
                    paciente: cita.paciente,
                    motivo: cita.motivo,
                    estado: cita.estado
                }
            };
        });
        
        // Actualizar la tabla también
        renderizarTablaCitas();
        
        successCallback(eventos);
    })
    .catch(error => {
        console.error('Error cargando citas:', error);
        failureCallback(error);
    });
}

/**
 * Aplica filtros de estado, veterinario, paciente y tutor a las citas
 */
function aplicarFiltros(citas) {
    if (!Array.isArray(citas)) {
        return [];
    }
    
    let citasFiltradas = citas;
    
    if (filtroEstado) {
        citasFiltradas = citasFiltradas.filter(cita => cita.estado === filtroEstado);
    }
    
    if (filtroVeterinario) {
        citasFiltradas = citasFiltradas.filter(cita => cita.veterinario == filtroVeterinario);
    }
    
    // Filtro por búsqueda de paciente
    const filtroPaciente = document.getElementById('filtro-paciente')?.value?.toLowerCase();
    if (filtroPaciente) {
        citasFiltradas = citasFiltradas.filter(cita => 
            (cita.paciente_nombre || '').toLowerCase().includes(filtroPaciente)
        );
    }
    
    // Filtro por búsqueda de tutor
    const filtroTutor = document.getElementById('filtro-tutor')?.value?.toLowerCase();
    if (filtroTutor) {
        citasFiltradas = citasFiltradas.filter(cita => 
            (cita.tutor_nombre || '').toLowerCase().includes(filtroTutor)
        );
    }
    
    return citasFiltradas;
}

/**
 * Carga los veterinarios disponibles en el select del modal y filtro.
 * Se obtiene del endpoint /api/veterinarios/
 */
function cargarVeterinarios() {
    fetch('/api/veterinarios/', {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(data => {
        // Select del modal
        const selectModal = document.getElementById('cita-veterinario');
        selectModal.innerHTML = '<option value="">Seleccionar veterinario...</option>';
        
        // Select del filtro
        const selectFiltro = document.getElementById('filtro-veterinario');
        selectFiltro.innerHTML = '<option value="">Todos los veterinarios</option>';
        
        data.forEach(vet => {
            // Modal
            const optionModal = document.createElement('option');
            optionModal.value = vet.id;
            optionModal.textContent = vet.nombre || vet.email;
            selectModal.appendChild(optionModal);
            
            // Filtro
            const optionFiltro = document.createElement('option');
            optionFiltro.value = vet.id;
            optionFiltro.textContent = vet.nombre || vet.email;
            selectFiltro.appendChild(optionFiltro);
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
// GESTIÓN DEL FORMULARIO DE CITAS
// ============================================================================

/**
 * Abre el formulario para crear una nueva cita (en acordeón)
 */
function abrirModalNuevaCita(fechaSeleccionada = null) {
    citaActualId = null;
    document.getElementById('btnEliminar').classList.add('hidden');
    document.getElementById('modal-error').classList.add('hidden');
    document.getElementById('formCita').reset();
    
    // Pre-llenar fecha si se hizo click en el calendario
    if (fechaSeleccionada) {
        document.getElementById('cita-fecha').value = fechaSeleccionada;
    }
    
    // Abrir acordeón de nueva cita
    const content = document.getElementById('content-nueva-cita');
    const icon = document.getElementById('icon-nueva-cita');
    
    if (!content.classList.contains('active')) {
        content.classList.add('active');
        icon.classList.add('rotate-180');
    }
}

/**
 * Abre el formulario para editar una cita existente
 */
function abrirModalEditarCita(citaId) {
    citaActualId = citaId;
    
    fetch(`/api/citas/${citaId}/`, {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(cita => {
        document.getElementById('btnEliminar').classList.remove('hidden');
        document.getElementById('modal-error').classList.add('hidden');
        
        // Llenar campos del formulario
        document.getElementById('cita-veterinario').value = cita.veterinario || '';
        document.getElementById('cita-paciente').value = cita.paciente || '';
        document.getElementById('cita-fecha').value = cita.fecha_hora.replace('Z', '').slice(0, 16);
        document.getElementById('cita-motivo').value = cita.motivo || '';
        document.getElementById('cita-estado').value = cita.estado;
        
        // Abrir acordeón de nueva cita (que ahora es para editar)
        const content = document.getElementById('content-nueva-cita');
        const icon = document.getElementById('icon-nueva-cita');
        
        if (!content.classList.contains('active')) {
            content.classList.add('active');
            icon.classList.add('rotate-180');
        }
        
        // Scroll suave al formulario
        document.getElementById('content-nueva-cita').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    })
    .catch(error => {
        console.error('Error cargando cita:', error);
        mostrarError('Error al cargar la cita');
    });
}

/**
 * Cancela y cierra el formulario
 */
function cancelarFormulario() {
    citaActualId = null;
    document.getElementById('formCita').reset();
    document.getElementById('btnEliminar').classList.add('hidden');
    document.getElementById('modal-error').classList.add('hidden');
    
    // Cerrar acordeón
    const content = document.getElementById('content-nueva-cita');
    const icon = document.getElementById('icon-nueva-cita');
    content.classList.remove('active');
    icon.classList.remove('rotate-180');
}

// ============================================================================
// OPERACIONES CRUD
// ============================================================================

/**
 * Guarda una cita (crear o actualizar).
 * 
 * Si el servidor retorna error 400, se captura el mensaje de validación
 * y se muestra en el formulario sin cerrarlo.
 * 
 * En caso de éxito, se actualiza el calendario y se cierra el formulario.
 */
function guardarCita() {
    const formData = {
        veterinario: document.getElementById('cita-veterinario').value,
        paciente: document.getElementById('cita-paciente').value,
        fecha_hora: document.getElementById('cita-fecha').value,
        motivo: document.getElementById('cita-motivo').value,
        estado: document.getElementById('cita-estado').value
    };
    
    // Validar campos requeridos
    if (!formData.veterinario || !formData.paciente || !formData.fecha_hora) {
        mostrarError('Por favor completa todos los campos obligatorios');
        return;
    }
    
    // Se convierte la fecha a formato ISO compatible con Django
    const fechaDate = new Date(formData.fecha_hora);
    if (isNaN(fechaDate.getTime())) {
        mostrarError('La fecha ingresada no es válida');
        return;
    }
    formData.fecha_hora = fechaDate.toISOString();
    
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
            cancelarFormulario(); // Cerrar acordeón y limpiar
            calendar.refetchEvents();
            mostrarExito('Cita guardada correctamente');
        } else if (response.status === 400) {
            // Se captura el error de validación y se muestra en el formulario
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
 * Elimina una cita con confirmación del usuario usando SweetAlert2.
 * Envía petición DELETE a la API y actualiza el calendario.
 */
function eliminarCita() {
    if (!citaActualId) {
        return;
    }
    
    Swal.fire({
        title: '¿Eliminar esta cita?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        color: '#fff',
        customClass: {
            popup: 'rounded-2xl border border-white/10'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/citas/${citaActualId}/`, {
                method: 'DELETE',
                headers: getHeaders()
            })
            .then(response => {
                if (response.ok) {
                    cancelarFormulario();
                    calendar.refetchEvents();
                    Swal.fire({
                        title: '¡Eliminada!',
                        text: 'La cita ha sido eliminada correctamente',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                        color: '#fff'
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'No se pudo eliminar la cita',
                        icon: 'error',
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                        color: '#fff'
                    });
                }
            })
            .catch(error => {
                console.error('Error eliminando cita:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Error al eliminar la cita',
                    icon: 'error',
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    color: '#fff'
                });
            });
        }
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
 * Muestra un mensaje de error con SweetAlert2
 * @param {string} mensaje - Texto del mensaje de error
 */
function mostrarError(mensaje) {
    Swal.fire({
        title: 'Error',
        text: mensaje,
        icon: 'error',
        timer: 3000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        color: '#fff',
        customClass: {
            popup: 'rounded-2xl border border-white/10'
        }
    });
}

/**
 * Muestra un mensaje de éxito con SweetAlert2
 * @param {string} mensaje - Texto del mensaje de éxito
 */
function mostrarExito(mensaje) {
    Swal.fire({
        title: '¡Éxito!',
        text: mensaje,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
        color: '#fff',
        customClass: {
            popup: 'rounded-2xl border border-white/10'
        }
    });
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
    
    // Pre-cargar citas para que la lista funcione inmediatamente
    fetch('/api/citas/', {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(data => {
        todasLasCitas = data;
        renderizarTablaCitas(); // Renderizar lista inicial
    })
    .catch(error => console.error('Error pre-cargando citas:', error));
    
    // Event Listeners para filtros
    document.getElementById('filtro-estado').addEventListener('change', function(e) {
        filtroEstado = e.target.value;
        if (calendar) {
            calendar.refetchEvents();
        }
        renderizarTablaCitas();
    });
    
    document.getElementById('filtro-veterinario').addEventListener('change', function(e) {
        filtroVeterinario = e.target.value;
        if (calendar) {
            calendar.refetchEvents();
        }
        renderizarTablaCitas();
    });
    
    // Event Listeners para búsqueda de paciente
    document.getElementById('filtro-paciente').addEventListener('input', function(e) {
        if (calendar) {
            calendar.refetchEvents();
        }
        renderizarTablaCitas();
    });
    
    // Event Listeners para búsqueda de tutor
    document.getElementById('filtro-tutor').addEventListener('input', function(e) {
        if (calendar) {
            calendar.refetchEvents();
        }
        renderizarTablaCitas();
    });
});

// ============================================================================
// FUNCIONES DE ACORDEÓN
// ============================================================================

/**
 * Toggle para mostrar/ocultar secciones de acordeón
 */
function toggleAccordion(section) {
    const content = document.getElementById(`content-${section}`);
    const icon = document.getElementById(`icon-${section}`);
    
    content.classList.toggle('active');
    icon.classList.toggle('rotate-180');
    
    // Si se abre el calendario, ajustar su tamaño
    if (section === 'calendario' && content.classList.contains('active') && calendar) {
        setTimeout(() => {
            calendar.updateSize();
        }, 400);
    }
}

/**
 * Renderiza las citas en la tabla
 */
function renderizarTablaCitas() {
    const tbody = document.getElementById('tabla-citas-body');
    const citasFiltradas = aplicarFiltros(todasLasCitas);
    
    tbody.innerHTML = '';
    
    if (citasFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-white/60">No hay citas que coincidan con los filtros.</td></tr>';
        return;
    }
    
    // Ordenar por fecha
    citasFiltradas.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    
    citasFiltradas.forEach(cita => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition';
        
        const fecha = new Date(cita.fecha_hora);
        const fechaFormateada = fecha.toLocaleDateString('es-CL', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        const horaFormateada = fecha.toLocaleTimeString('es-CL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const estadoClases = {
            'CONFIRMADA': 'bg-green-500/20 text-green-300 border border-green-500/50',
            'PENDIENTE': 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50',
            'CANCELADA': 'bg-red-500/20 text-red-300 border border-red-500/50',
            'COMPLETADA': 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
        };
        
        row.innerHTML = `
            <td class="p-4">
                <div class="text-white/80 font-semibold">${fechaFormateada}</div>
                <div class="text-white/60 text-xs">${horaFormateada}</div>
            </td>
            <td class="p-4 text-white/80">${cita.paciente_nombre || 'N/A'}</td>
            <td class="p-4 text-white/60">${cita.tutor_nombre || 'N/A'}</td>
            <td class="p-4 text-white/60">${cita.veterinario_nombre || 'N/A'}</td>
            <td class="p-4 text-white/60 max-w-xs truncate">${cita.motivo || '-'}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-lg text-xs font-semibold ${estadoClases[cita.estado] || ''}">${cita.estado}</span>
            </td>
            <td class="p-4">
                <div class="flex justify-center gap-2">
                    <button onclick="abrirModalEditarCita(${cita.id})" 
                            class="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition" 
                            title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="cambiarEstadoCita(${cita.id}, 'CONFIRMADA')" 
                            class="px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-300 transition" 
                            title="Confirmar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="cambiarEstadoCita(${cita.id}, 'CANCELADA')" 
                            class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 transition" 
                            title="Marcar como Cancelada">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Cambia rápidamente el estado de una cita
 */
function cambiarEstadoCita(citaId, nuevoEstado) {
    fetch(`/api/citas/${citaId}/`, {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(cita => {
        cita.estado = nuevoEstado;
        
        return fetch(`/api/citas/${citaId}/`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(cita)
        });
    })
    .then(response => {
        if (response.ok) {
            if (calendar) {
                calendar.refetchEvents();
            }
            renderizarTablaCitas();
            mostrarExito(`Cita ${nuevoEstado.toLowerCase()} correctamente`);
        }
    })
    .catch(error => {
        console.error('Error cambiando estado:', error);
        mostrarError('Error al cambiar el estado de la cita');
    });
}
