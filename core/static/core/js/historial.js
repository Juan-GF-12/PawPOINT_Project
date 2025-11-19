/**
 * HISTORIAL MÉDICO CON TIMELINE
 * 
 * Este módulo gestiona la visualización del historial médico de un paciente.
 * Incluye:
 * - Carga de datos del paciente desde la API
 * - Renderización de fichas clínicas en formato timeline
 * - Creación de nuevas fichas clínicas y tratamientos
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let pacienteId = null;
const modalFicha = new bootstrap.Modal(document.getElementById('modalFicha'));

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Se ejecuta cuando el DOM está completamente cargado.
 * Obtiene el ID del paciente y carga los datos.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Se obtiene el ID del paciente de los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    pacienteId = urlParams.get('paciente_id');
    
    // Si no hay ID de paciente, se redirige a pacientes
    if (!pacienteId) {
        window.location.href = '/pacientes/';
        return;
    }
    
    // Se cargan los datos del paciente y el historial
    cargarPerfilPaciente();
    cargarTimelineFichas();
});

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

/**
 * Obtiene los headers necesarios para autenticación JWT.
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
// CARGAR DATOS DEL PACIENTE
// ============================================================================

/**
 * Carga los datos del paciente desde la API y los inyecta en la tarjeta de perfil.
 * Se obtiene información como nombre, especie, raza, edad y tutor.
 */
function cargarPerfilPaciente() {
    fetch(`/api/pacientes/${pacienteId}/`, {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(paciente => {
        // Se llenan los campos de la tarjeta de perfil
        document.getElementById('paciente-nombre').textContent = paciente.nombre;
        document.getElementById('paciente-especie').textContent = paciente.especie;
        document.getElementById('paciente-raza').textContent = paciente.raza || 'N/A';
        document.getElementById('paciente-tutor').textContent = `ID: ${paciente.tutor}`;
        
        // Se calcula la edad aproximada
        const fechaNacimiento = new Date(paciente.fecha_nacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
        const mes = hoy.getMonth() - fechaNacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
            edad--;
        }
        document.getElementById('paciente-edad').textContent = `${edad} años`;
    })
    .catch(error => {
        console.error('Error cargando perfil:', error);
        mostrarError('Error al cargar datos del paciente');
    });
}

// ============================================================================
// CARGAR Y RENDERIZAR TIMELINE
// ============================================================================

/**
 * Carga las fichas clínicas del paciente y las renderiza en el timeline.
 * Se ordena de más reciente a más antigua.
 */
function cargarTimelineFichas() {
    fetch(`/api/fichas/?paciente=${pacienteId}`, {
        headers: getHeaders()
    })
    .then(response => response.json())
    .then(fichas => {
        const container = document.getElementById('timeline-container');
        
        // Se ordena de más reciente a más antigua
        fichas.sort((a, b) => new Date(b.fecha_consulta) - new Date(a.fecha_consulta));
        
        // Si no hay fichas, se muestra un mensaje
        if (fichas.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay fichas clínicas registradas para este paciente.
                </div>
            `;
            return;
        }
        
        // Se limpian fichas anteriores
        container.innerHTML = '';
        
        // Se renderiza cada ficha
        fichas.forEach(ficha => {
            renderizarTarjetaFicha(ficha, container);
        });
    })
    .catch(error => {
        console.error('Error cargando fichas:', error);
        document.getElementById('timeline-container').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar el historial clínico.
            </div>
        `;
    });
}

/**
 * Renderiza una ficha clínica como una tarjeta en el timeline.
 * Incluye diagnóstico, vitales y botones de acción.
 *
 * @param {Object} ficha - Datos de la ficha clínica
 * @param {HTMLElement} container - Contenedor donde insertar la tarjeta
 */
function renderizarTarjetaFicha(ficha, container) {
    const fechaConsulta = new Date(ficha.fecha_consulta);
    const fechaFormato = fechaConsulta.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    // Se calcula la edad del paciente en el momento de la consulta
    const fechaNacimiento = new Date(document.querySelector('[data-fecha-nacimiento]')?.dataset.fechaNacimiento || new Date());
    let edadEnConsulta = fechaConsulta.getFullYear() - fechaNacimiento.getFullYear();
    
    // Se construye la tarjeta
    const tarjeta = document.createElement('div');
    tarjeta.className = 'card timeline-card mb-4';
    
    let contenidoTratamiento = '';
    if (ficha.tratamientos && ficha.tratamientos.length > 0) {
        contenidoTratamiento = `
            <div class="mt-3 pt-3 border-top">
                <strong>Tratamientos:</strong>
                <ul class="small mb-0 mt-2">
                    ${ficha.tratamientos.map(t => `
                        <li>${t.medicamento || 'N/A'} - ${t.descripcion || ''}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    tarjeta.innerHTML = `
        <div class="card-body">
            <!-- Header de la tarjeta -->
            <div class="timeline-header">
                <div>
                    <div class="timeline-date"><i class="fas fa-calendar me-2"></i>${fechaFormato}</div>
                    <div class="timeline-vet"><strong>Veterinario:</strong> ${ficha.veterinario_nombre || 'Sin especificar'}</div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            
            <!-- Motivo de consulta -->
            <p class="text-muted small mb-2">
                <strong>Motivo:</strong> ${ficha.motivo || 'No especificado'}
            </p>
            
            <!-- Diagnóstico -->
            <div class="diagnóstico-box">
                <strong>Diagnóstico:</strong>
                <p class="mb-0 mt-2">${ficha.diagnostico}</p>
            </div>
            
            <!-- Vitales -->
            <div class="vitals-row">
                ${ficha.peso ? `<span class="vital-badge"><i class="fas fa-weight me-1"></i>${ficha.peso} kg</span>` : ''}
                ${ficha.temperatura ? `<span class="vital-badge"><i class="fas fa-thermometer-half me-1"></i>${ficha.temperatura}°C</span>` : ''}
            </div>
            
            <!-- Notas médicas -->
            ${ficha.notas_medicas ? `
                <div class="mt-3">
                    <small class="text-muted"><strong>Notas:</strong></small>
                    <p class="small mb-0">${ficha.notas_medicas}</p>
                </div>
            ` : ''}
            
            <!-- Tratamientos -->
            ${contenidoTratamiento}
        </div>
    `;
    
    container.appendChild(tarjeta);
}

// ============================================================================
// GESTIÓN DEL MODAL DE FICHA
// ============================================================================

/**
 * Abre el modal para crear una nueva ficha clínica.
 * Limpia los campos del formulario.
 */
function abrirModalFicha() {
    document.getElementById('formFicha').reset();
    document.getElementById('ficha-error').classList.add('d-none');
    document.getElementById('agregarTratamiento').checked = false;
    document.getElementById('tratamiento-fields').classList.add('d-none');
    modalFicha.show();
}

/**
 * Alterna la visibilidad de los campos de tratamiento.
 * Se ejecuta cuando el usuario marca/desmarca el checkbox.
 */
function toggleTratamientoFields() {
    const checkbox = document.getElementById('agregarTratamiento');
    const fields = document.getElementById('tratamiento-fields');
    
    if (checkbox.checked) {
        fields.classList.remove('d-none');
    } else {
        fields.classList.add('d-none');
    }
}

/**
 * Guarda una nueva ficha clínica y opcionalmente un tratamiento.
 * Si hay error de validación, se muestra en el modal sin cerrarlo.
 */
function guardarFicha() {
    // Se recopilan los datos del formulario
    const fichaData = {
        paciente: pacienteId,
        motivo: document.getElementById('ficha-motivo').value,
        diagnostico: document.getElementById('ficha-diagnostico').value,
        notas_medicas: document.getElementById('ficha-notas').value,
        peso: document.getElementById('ficha-peso').value || null,
        temperatura: document.getElementById('ficha-temperatura').value || null
    };
    
    // Se valida que los campos obligatorios estén llenos
    if (!fichaData.motivo || !fichaData.diagnostico) {
        mostrarErrorModal('Por favor completa los campos obligatorios (Motivo y Diagnóstico)');
        return;
    }
    
    // Se guarda la ficha clínica
    fetch('/api/fichas/', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(fichaData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else if (response.status === 400) {
            return response.json().then(data => {
                throw new Error(data.detail || 'Error de validación');
            });
        }
        throw new Error('Error al guardar ficha');
    })
    .then(fichaCreada => {
        // Se guarda el tratamiento si fue seleccionado
        if (document.getElementById('agregarTratamiento').checked) {
            guardarTratamiento(fichaCreada.id);
        } else {
            // Se cierra el modal y se recarga el timeline
            modalFicha.hide();
            cargarTimelineFichas();
            mostrarExito('Ficha clínica guardada correctamente');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarErrorModal(error.message || 'Error al guardar ficha');
    });
}

/**
 * Guarda un tratamiento asociado a una ficha clínica.
 *
 * @param {number} fichaId - ID de la ficha clínica creada
 */
function guardarTratamiento(fichaId) {
    const tratamientoData = {
        ficha_clinica: fichaId,
        medicamento: document.getElementById('tratamiento-medicamento').value,
        descripcion: document.getElementById('tratamiento-instrucciones').value,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: document.getElementById('tratamiento-fecha-fin').value || null
    };
    
    fetch('/api/tratamientos/', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tratamientoData)
    })
    .then(response => response.json())
    .then(() => {
        // Se cierra el modal y se recarga el timeline
        modalFicha.hide();
        cargarTimelineFichas();
        mostrarExito('Ficha y tratamiento guardados correctamente');
    })
    .catch(error => {
        console.error('Error guardando tratamiento:', error);
        // Aún así se considera como éxito la ficha clínica
        modalFicha.hide();
        cargarTimelineFichas();
        mostrarExito('Ficha clínica guardada (error al guardar tratamiento)');
    });
}

// ============================================================================
// FUNCIONES DE NOTIFICACIÓN
// ============================================================================

/**
 * Muestra un mensaje de error dentro del modal (sin cerrarlo).
 *
 * @param {string} mensaje - Texto del error
 */
function mostrarErrorModal(mensaje) {
    const errorDiv = document.getElementById('ficha-error');
    errorDiv.textContent = mensaje;
    errorDiv.classList.remove('d-none');
}

/**
 * Muestra un mensaje de error temporal fuera del modal.
 * La alerta desaparece automáticamente después de 5 segundos.
 *
 * @param {string} mensaje - Texto del error
 */
function mostrarError(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger alert-dismissible fade show';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').insertBefore(alerta, document.querySelector('.container-fluid'));
    
    setTimeout(() => alerta.remove(), 5000);
}

/**
 * Muestra un mensaje de éxito temporal.
 * La alerta desaparece automáticamente después de 5 segundos.
 *
 * @param {string} mensaje - Texto del éxito
 */
function mostrarExito(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').insertBefore(alerta, document.querySelector('.container-fluid'));
    
    setTimeout(() => alerta.remove(), 5000);
}
