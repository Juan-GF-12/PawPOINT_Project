/**
 * HISTORIAL MÉDICO CON TIMELINE
 * 
 * Este módulo gestiona la visualización del historial médico de un paciente.
 * Incluye:
 * - Carga de datos del paciente desde la API
 * - Renderización de fichas clínicas en formato timeline
 * - Creación de nuevas fichas clínicas y tratamientos
 * - Adaptación de interfaz según el rol del usuario (Tutor vs Veterinario)
 * - Sistema de navegación condicional basado en roles
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let pacienteId = null;
let usuarioRol = null; // Almacena el rol del usuario actual
let modalFicha = null; // Se inicializará solo si existe el modal

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Se ejecuta cuando el DOM está completamente cargado.
 * Obtiene el ID del paciente, verifica el rol del usuario y carga los datos.
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Se obtiene el ID del paciente de los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    pacienteId = urlParams.get('paciente_id');
    
    // Si no hay ID de paciente, redirigir según rol
    if (!pacienteId) {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'Tutor') {
            window.location.href = '/portal/';
        } else {
            window.location.href = '/pacientes/';
        }
        return;
    }
    
    // Inicializar vista según el rol del usuario
    await inicializarVista();
    
    // Renderizar controles de navegación
    renderNavigationControls();
    
    // Se cargan los datos del paciente y el historial
    cargarPerfilPaciente();
    cargarTimelineFichas();
});

// ============================================================================
// FUNCIONES DE ROL Y ADAPTACIÓN DE INTERFAZ
// ============================================================================

/**
 * Renderiza el botón "Volver" dinámicamente según el rol del usuario
 */
function renderNavigationControls() {
    const container = document.getElementById('navigation-controls');
    const userRole = localStorage.getItem('userRole');
    
    if (!container) return;
    
    if (userRole === 'Tutor') {
        // Tutores vuelven al portal
        container.innerHTML = `
            <a href="/portal/" class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition">
                <i class="fas fa-arrow-left"></i>
                <span>Volver a mis Mascotas</span>
            </a>`;
    } else if (['Veterinario', 'Asistente', 'Administrador'].includes(userRole)) {
        // Staff vuelve a gestión clínica
        container.innerHTML = `
            <a href="/gestion-clinica/" class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition">
                <i class="fas fa-arrow-left"></i>
                <span>Volver a Gestión Clínica</span>
            </a>`;
    }
}

/**
 * Inicializa la vista y adapta la interfaz según el rol del usuario.
 */
async function inicializarVista() {
    const token = localStorage.getItem('accessToken');
    if (!token) { 
        window.location.href = '/login/'; 
        return; 
    }

    // 1. Obtener quién soy
    const response = await fetch('/api/me/', { 
        headers: { 'Authorization': 'Bearer ' + token } 
    });
    
    if (!response.ok) {
        window.location.href = '/login/';
        return;
    }
    
    const user = await response.json();
    usuarioRol = user.rol;

    // 2. Lógica de Adaptación Visual
    if (user.rol === 'Tutor') {
        aplicarModoTutor();
    } else {
        // Inicializar modal solo para veterinarios
        const modalElement = document.getElementById('modalFicha');
        if (modalElement) {
            modalFicha = new bootstrap.Modal(modalElement);
        }
    }
    // Si es Veterinario/Asistente/Administrador, mantener vista por defecto
}

/**
 * Aplica ajustes visuales para el modo Tutor (solo lectura).
 */
function aplicarModoTutor() {
    // A. ELIMINAR/OCULTAR Sidebar
    const sidebar = document.getElementById('sidebar-wrapper');
    if (sidebar) {
        sidebar.style.display = 'none'; // Ocultar completamente
    }

    // B. EXPANDIR Contenido Principal
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        // Quitar flex-1 y ocupar todo el ancho
        mainContent.style.width = '100%';
        mainContent.style.maxWidth = '100%';
    }

    // C. MOSTRAR Controles de Tutor
    const tutorControls = document.getElementById('tutor-controls');
    if (tutorControls) {
        tutorControls.classList.remove('d-none');
    }
    
    // Nota: El botón de Nueva Ficha y el modal ya no se renderizan en el HTML
    // para tutores, por lo que no es necesario ocultarlos aquí.
    // Los botones de edición en las tarjetas se ocultarán durante el renderizado.
}

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
        
        // Actualizar el detalle de raza en el perfil (si existe el elemento)
        const razaDetail = document.getElementById('paciente-raza-detail');
        if (razaDetail) {
            razaDetail.textContent = paciente.raza || 'N/A';
        }
        
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
 * Renderiza una ficha clínica como una tarjeta en el timeline con diseño mejorado.
 * Incluye badges de tipo, iconos visuales y chips para signos vitales.
 *
 * @param {Object} ficha - Datos de la ficha clínica
 * @param {HTMLElement} container - Contenedor donde insertar la tarjeta
 */
function renderizarTarjetaFicha(ficha, container) {
    const fechaConsulta = new Date(ficha.fecha_consulta);
    const fechaFormato = fechaConsulta.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    // Crear elemento del timeline
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    
    // Crear tarjeta médica
    const tarjeta = document.createElement('div');
    tarjeta.className = 'card medical-card shadow-sm';
    
    // Determinar tipo de consulta y badge
    let tipoBadge = '';
    const motivo = (ficha.motivo || '').toLowerCase();
    if (motivo.includes('vacuna') || motivo.includes('vacunación')) {
        tipoBadge = '<span class="badge bg-success">💉 Vacunación</span>';
    } else if (motivo.includes('cirugía') || motivo.includes('operación')) {
        tipoBadge = '<span class="badge bg-danger">🏥 Cirugía</span>';
    } else if (motivo.includes('control') || motivo.includes('revisión')) {
        tipoBadge = '<span class="badge bg-info">✅ Control</span>';
    } else {
        tipoBadge = '<span class="badge bg-primary">🩺 Consulta</span>';
    }
    
    // Contenido de tratamientos con diseño mejorado
    let contenidoTratamiento = '';
    if (ficha.tratamientos && ficha.tratamientos.length > 0) {
        const tratamientosHTML = ficha.tratamientos.map(t => `
            <div class="d-flex align-items-center gap-2 mb-2 p-2 rounded" style="background: #fff3cd; border-left: 3px solid #ffc107;">
                <i class="fas fa-pills text-warning"></i>
                <div class="flex-grow-1">
                    <strong>${t.medicamento || 'Medicamento'}</strong>
                    ${t.descripcion ? `<br><small class="text-muted">${t.descripcion}</small>` : ''}
                </div>
            </div>
        `).join('');
        
        contenidoTratamiento = `
            <div class="mt-3 p-3 bg-light rounded">
                <h6 class="fw-semibold mb-3">
                    <i class="fas fa-prescription-bottle-alt text-success me-2"></i>
                    Plan de Tratamiento
                </h6>
                ${tratamientosHTML}
            </div>
        `;
    }
    
    // Botones de acción (solo para veterinarios)
    let botonesAccion = '';
    if (usuarioRol !== 'Tutor') {
        botonesAccion = `
            <button class="btn btn-sm btn-outline-primary" title="Ver detalles" onclick="verDetallesFicha(${ficha.id})">
                <i class="fas fa-eye"></i>
            </button>
        `;
    }
    
    tarjeta.innerHTML = `
        <div class="card-body p-4">
            <!-- Header: Fecha y Tipo -->
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <div class="fw-bold text-dark fs-6 mb-1">${fechaFormato}</div>
                    <div class="text-muted small">
                        <i class="fas fa-user-md me-1"></i>
                        ${ficha.veterinario_nombre || 'Sin especificar'}
                    </div>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    ${tipoBadge}
                    ${botonesAccion}
                </div>
            </div>
            
            <!-- Motivo Destacado -->
            <div class="mb-3 p-2 rounded" style="background: #e7f3ff; border-left: 3px solid #0d6efd;">
                <strong class="text-primary">📋 Motivo:</strong>
                <span class="ms-2">${ficha.motivo || 'No especificado'}</span>
            </div>
            
            <!-- Diagnóstico -->
            <div class="mb-3">
                <strong class="text-success d-block mb-2">
                    <i class="fas fa-stethoscope me-2"></i>Diagnóstico
                </strong>
                <p class="text-dark mb-0" style="line-height: 1.6;">${ficha.diagnostico}</p>
            </div>
            
            <!-- Signos Vitales con Iconos Emoji -->
            ${(ficha.peso || ficha.temperatura) ? `
                <div class="d-flex gap-2 mb-3 flex-wrap">
                    ${ficha.peso ? `
                        <span class="vital-chip">
                            <i class="fas fa-weight text-warning"></i>
                            <strong>${ficha.peso}</strong> kg
                        </span>
                    ` : ''}
                    ${ficha.temperatura ? `
                        <span class="vital-chip">
                            <i class="fas fa-thermometer-half text-danger"></i>
                            <strong>${ficha.temperatura}</strong> °C
                        </span>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Notas médicas -->
            ${ficha.notas_medicas ? `
                <div class="mt-3 p-2 bg-light rounded">
                    <small class="text-muted fw-semibold">
                        <i class="fas fa-notes-medical me-1"></i>Notas:
                    </small>
                    <p class="small mb-0 mt-1 text-dark">${ficha.notas_medicas}</p>
                </div>
            ` : ''}
            
            <!-- Tratamientos -->
            ${contenidoTratamiento}
        </div>
    `;
    
    timelineItem.appendChild(tarjeta);
    container.appendChild(timelineItem);
}

// ============================================================================
// GESTIÓN DEL MODAL DE FICHA
// ============================================================================

/**
 * Abre el modal para crear una nueva ficha clínica.
 * Limpia los campos del formulario y resetea la lista de medicamentos.
 */
function abrirModalFicha() {
    document.getElementById('formFicha').reset();
    document.getElementById('ficha-error').classList.add('d-none');
    
    // Limpiar y resetear lista de medicamentos
    const container = document.getElementById('medicamentos-container');
    container.innerHTML = `
        <div class="row g-2 mb-2 medicamento-row">
            <div class="col-md-3">
                <label class="form-label small text-muted">Medicamento</label>
                <input type="text" class="form-control form-control-sm" placeholder="Nombre" name="med_nombre[]">
            </div>
            <div class="col-md-2">
                <label class="form-label small text-muted">Cantidad</label>
                <input type="number" step="0.01" class="form-control form-control-sm" placeholder="0.00" name="med_cantidad[]">
            </div>
            <div class="col-md-2">
                <label class="form-label small text-muted">Unidad</label>
                <select class="form-select form-select-sm" name="med_unidad[]">
                    <option value="">Elegir</option>
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="ui">ui</option>
                    <option value="comprimidos">comprimidos</option>
                    <option value="gotas">gotas</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small text-muted">Frecuencia</label>
                <select class="form-select form-select-sm" name="med_frecuencia[]">
                    <option value="">Elegir</option>
                    <option value="c/24h">c/24h</option>
                    <option value="c/12h">c/12h</option>
                    <option value="c/8h">c/8h</option>
                    <option value="c/6h">c/6h</option>
                    <option value="c/4h">c/4h</option>
                    <option value="única vez">Única vez</option>
                </select>
            </div>
            <div class="col-md-2">
                <label class="form-label small text-muted">Duración (días)</label>
                <input type="number" step="1" min="1" class="form-control form-control-sm" placeholder="7" name="med_duracion[]">
            </div>
            <div class="col-md-1">
                <label class="form-label small text-muted invisible">X</label>
                <button type="button" onclick="eliminarFila(this)" class="btn btn-sm btn-outline-danger w-100 invisible" title="Eliminar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    modalFicha.show();
}

// Nota: La función toggleTratamientoFields ya no es necesaria
// El nuevo diseño muestra los medicamentos siempre en el modal

/**
 * Agrega una nueva fila de medicamento al formulario de receta.
 * Permite crear múltiples prescripciones en una sola consulta.
 */
function agregarMedicamento() {
    const container = document.getElementById('medicamentos-container');
    
    const nuevaFila = document.createElement('div');
    nuevaFila.className = 'row g-2 mb-2 medicamento-row';
    
    nuevaFila.innerHTML = `
        <div class="col-md-3">
            <label class="form-label small text-muted">Medicamento</label>
            <input type="text" class="form-control form-control-sm" placeholder="Nombre" name="med_nombre[]">
        </div>
        <div class="col-md-2">
            <label class="form-label small text-muted">Cantidad</label>
            <input type="number" step="0.01" class="form-control form-control-sm" placeholder="0.00" name="med_cantidad[]">
        </div>
        <div class="col-md-2">
            <label class="form-label small text-muted">Unidad</label>
            <select class="form-select form-select-sm" name="med_unidad[]">
                <option value="">Elegir</option>
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="ui">ui</option>
                <option value="comprimidos">comprimidos</option>
                <option value="gotas">gotas</option>
            </select>
        </div>
        <div class="col-md-2">
            <label class="form-label small text-muted">Frecuencia</label>
            <select class="form-select form-select-sm" name="med_frecuencia[]">
                <option value="">Elegir</option>
                <option value="c/24h">c/24h</option>
                <option value="c/12h">c/12h</option>
                <option value="c/8h">c/8h</option>
                <option value="c/6h">c/6h</option>
                <option value="c/4h">c/4h</option>
                <option value="única vez">Única vez</option>
            </select>
        </div>
        <div class="col-md-2">
            <label class="form-label small text-muted">Duración (días)</label>
            <input type="number" step="1" min="1" class="form-control form-control-sm" placeholder="7" name="med_duracion[]">
        </div>
        <div class="col-md-1">
            <label class="form-label small text-muted invisible">X</label>
            <button type="button" onclick="eliminarFila(this)" class="btn btn-sm btn-outline-danger w-100" title="Eliminar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(nuevaFila);
}

/**
 * Elimina una fila de medicamento del formulario.
 * @param {HTMLElement} boton - El botón de eliminar que fue clickeado
 */
function eliminarFila(boton) {
    const container = document.getElementById('medicamentos-container');
    
    // Evitar eliminar si solo queda una fila
    if (container.querySelectorAll('.medicamento-row').length <= 1) {
        Swal.fire({
            title: 'No se puede eliminar',
            text: 'Debe mantener al menos un medicamento en la receta.',
            icon: 'warning',
            confirmButtonColor: '#0061ff'
        });
        return;
    }
    
    // Eliminar la fila padre del botón
    boton.closest('.medicamento-row').remove();
}

/**
 * Valida los datos clínicos antes de guardar la ficha.
 * Aplica reglas veterinarias estrictas y muestra errores con SweetAlert2.
 * @returns {boolean} true si todos los datos son válidos
 */
function validarDatosClinicos() {
    // 1. Validar campos obligatorios
    const motivo = document.getElementById('ficha-motivo').value.trim();
    const diagnostico = document.getElementById('ficha-diagnostico').value.trim();
    
    if (!motivo) {
        Swal.fire({
            title: 'Campo Obligatorio',
            text: 'El motivo de consulta es obligatorio.',
            icon: 'warning',
            confirmButtonColor: '#0061ff'
        });
        return false;
    }
    
    if (!diagnostico) {
        Swal.fire({
            title: 'Campo Obligatorio',
            text: 'El diagnóstico es obligatorio.',
            icon: 'warning',
            confirmButtonColor: '#0061ff'
        });
        return false;
    }
    
    // 2. Validar peso
    const peso = parseFloat(document.getElementById('ficha-peso').value);
    if (peso && peso <= 0) {
        Swal.fire({
            title: 'Error en Peso',
            text: 'El peso debe ser mayor a 0 kg.',
            icon: 'error',
            confirmButtonColor: '#0061ff'
        });
        return false;
    }
    
    // 3. Validar temperatura (rango fisiológico veterinario)
    const temperatura = parseFloat(document.getElementById('ficha-temperatura').value);
    if (temperatura) {
        if (temperatura < 35 || temperatura > 43) {
            Swal.fire({
                title: 'Temperatura Anormal',
                html: 'Rango de temperatura fisiológicamente imposible.<br>Verifique los datos.<br><small>Rango normal: 37.5-39.5°C</small>',
                icon: 'error',
                confirmButtonColor: '#0061ff'
            });
            return false;
        }
    }
    
    // 4. Validar receta (si hay medicamentos con nombre)
    const nombresInputs = document.querySelectorAll('input[name="med_nombre[]"]');
    const hayMedicamentos = Array.from(nombresInputs).some(input => input.value.trim() !== '');
    
    if (hayMedicamentos) {
        const nombresInputs = document.querySelectorAll('input[name="med_nombre[]"]');
        const cantidadInputs = document.querySelectorAll('input[name="med_cantidad[]"]');
        const unidadSelects = document.querySelectorAll('select[name="med_unidad[]"]');
        const frecuenciaSelects = document.querySelectorAll('select[name="med_frecuencia[]"]');
        
        for (let i = 0; i < nombresInputs.length; i++) {
            const nombre = nombresInputs[i].value.trim();
            const cantidad = cantidadInputs[i].value.trim();
            const unidad = unidadSelects[i].value;
            const frecuencia = frecuenciaSelects[i].value;
            
            // Si hay nombre de medicamento, DEBE tener todos los datos
            if (nombre) {
                if (!cantidad || !unidad || !frecuencia) {
                    Swal.fire({
                        title: 'Receta Incompleta',
                        html: `Faltan detalles de dosificación para el medicamento:<br><strong>${nombre}</strong><br><small>Debe especificar: Cantidad, Unidad y Frecuencia</small>`,
                        icon: 'error',
                        confirmButtonColor: '#0061ff'
                    });
                    return false;
                }
                
                // Validar que cantidad sea positiva
                if (parseFloat(cantidad) <= 0) {
                    Swal.fire({
                        title: 'Cantidad Inválida',
                        text: `La cantidad de "${nombre}" debe ser mayor a 0.`,
                        icon: 'error',
                        confirmButtonColor: '#0061ff'
                    });
                    return false;
                }
            }
        }
    }
    
    return true;
}

/**
 * Guarda una nueva ficha clínica y opcionalmente tratamientos múltiples.
 * Si hay error de validación, se muestra en el modal sin cerrarlo.
 */
function guardarFicha() {
    // VALIDAR DATOS ANTES DE ENVIAR
    if (!validarDatosClinicos()) {
        return; // Detener si hay errores de validación
    }
    
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
        // Verificar si hay medicamentos para guardar
        const nombresInputs = document.querySelectorAll('input[name="med_nombre[]"]');
        const hayMedicamentos = Array.from(nombresInputs).some(input => input.value.trim() !== '');
        
        if (hayMedicamentos) {
            guardarTratamientos(fichaCreada.id);
        } else {
            // Se cierra el modal y se recarga el timeline
            modalFicha.hide();
            cargarTimelineFichas();
            Swal.fire({
                title: '¡Ficha Guardada!',
                text: 'La consulta se ha registrado correctamente.',
                icon: 'success',
                confirmButtonColor: '#0061ff',
                timer: 2000
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error al Guardar',
            text: error.message || 'Error al guardar la ficha clínica. Intente nuevamente.',
            icon: 'error',
            confirmButtonColor: '#0061ff'
        });
    });
}

/**
 * Guarda múltiples tratamientos asociados a una ficha clínica.
 * Lee todos los inputs de medicamentos y los envía al backend.
 *
 * @param {number} fichaId - ID de la ficha clínica creada
 */
function guardarTratamientos(fichaId) {
    // Recolectar todos los inputs de medicamentos
    const nombresInputs = document.querySelectorAll('input[name="med_nombre[]"]');
    const cantidadInputs = document.querySelectorAll('input[name="med_cantidad[]"]');
    const unidadSelects = document.querySelectorAll('select[name="med_unidad[]"]');
    const frecuenciaSelects = document.querySelectorAll('select[name="med_frecuencia[]"]');
    const duracionInputs = document.querySelectorAll('input[name="med_duracion[]"]');
    
    const medicamentos = [];
    
    // Procesar cada fila de medicamento
    for (let i = 0; i < nombresInputs.length; i++) {
        const nombre = nombresInputs[i].value.trim();
        const cantidad = cantidadInputs[i].value.trim();
        const unidad = unidadSelects[i].value;
        const frecuencia = frecuenciaSelects[i].value;
        const duracion = duracionInputs[i] ? duracionInputs[i].value.trim() : '';
        
        // Solo agregar si al menos tiene nombre
        if (nombre) {
            medicamentos.push({
                nombre: nombre,
                cantidad: cantidad,
                unidad: unidad,
                frecuencia: frecuencia,
                duracion: duracion
            });
        }
    }
    
    // Si no hay medicamentos, solo cerrar el modal
    if (medicamentos.length === 0) {
        modalFicha.hide();
        cargarTimelineFichas();
        Swal.fire({
            title: '¡Ficha Guardada!',
            text: 'La consulta se ha registrado correctamente.',
            icon: 'success',
            confirmButtonColor: '#0061ff',
            timer: 2000
        });
        return;
    }
    
    // Crear una promesa para cada medicamento
    const promesas = medicamentos.map(med => {
        // Formatear descripción estructurada: "Amoxicilina 50 mg cada 12h por 5 días"
        let descripcionFormateada = `${med.cantidad} ${med.unidad} ${med.frecuencia}`;
        if (med.duracion) {
            descripcionFormateada += ` por ${med.duracion} días`;
        }
        
        const tratamientoData = {
            ficha_clinica: fichaId,
            medicamento: med.nombre,
            descripcion: descripcionFormateada,
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: med.duracion ? calcularFechaFin(parseInt(med.duracion)) : null
        };
        
        return fetch('/api/tratamientos/', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(tratamientoData)
        });
    });
    
    // Esperar a que todos los tratamientos se guarden
    Promise.all(promesas)
        .then(() => {
            modalFicha.hide();
            cargarTimelineFichas();
            
            // Mostrar éxito con opción de imprimir receta
            Swal.fire({
                title: '¡Ficha Guardada!',
                html: `La consulta y ${medicamentos.length} tratamiento(s) se han registrado correctamente.<br><br>¿Deseas imprimir la receta?`,
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: '#0061ff',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="fas fa-print mr-2"></i>Imprimir Receta',
                cancelButtonText: 'Cerrar'
            }).then((result) => {
                if (result.isConfirmed) {
                    imprimirReceta(medicamentos, fichaId);
                }
            });
        })
        .catch(error => {
            console.error('Error guardando tratamientos:', error);
            modalFicha.hide();
            cargarTimelineFichas();
            Swal.fire({
                title: 'Advertencia',
                text: 'Ficha clínica guardada, pero algunos tratamientos no se pudieron guardar.',
                icon: 'warning',
                confirmButtonColor: '#0061ff'
            });
        });
}

/**
 * Calcula la fecha de finalización sumando días a la fecha actual.
 * @param {number} dias - Número de días a sumar
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function calcularFechaFin(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
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
    errorDiv.classList.remove('hidden');
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

// ============================================================================
// FUNCIONES DE IMPRESIÓN
// ============================================================================

/**
 * Genera e imprime una receta médica con los medicamentos prescritos
 * @param {Array} medicamentos - Array de medicamentos con toda su información
 * @param {number} fichaId - ID de la ficha clínica
 */
function imprimirReceta(medicamentos, fichaId) {
    // Obtener datos del paciente y veterinario
    const pacienteNombre = document.querySelector('[data-paciente-nombre]')?.dataset.pacienteNombre || 'Paciente';
    const pacienteEspecie = document.querySelector('[data-paciente-especie]')?.dataset.pacienteEspecie || '';
    
    // Crear ventana de impresión
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
    
    const fechaHoy = new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    // Generar HTML de la receta
    let htmlReceta = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receta Médica - ${pacienteNombre}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    padding: 40px;
                    background: white;
                    color: #333;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #0061ff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #0061ff;
                    font-size: 28px;
                    margin-bottom: 5px;
                }
                .header p {
                    color: #666;
                    font-size: 14px;
                }
                .info-section {
                    margin-bottom: 30px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .info-box {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #0061ff;
                }
                .info-box h3 {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .info-box p {
                    font-size: 16px;
                    color: #333;
                    font-weight: bold;
                }
                .receta-section {
                    margin-top: 30px;
                }
                .receta-section h2 {
                    color: #0061ff;
                    font-size: 20px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #e9ecef;
                    padding-bottom: 10px;
                }
                .medicamento {
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .medicamento h3 {
                    color: #0061ff;
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                .med-detalles {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                .med-detalle {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 6px;
                }
                .med-detalle strong {
                    display: block;
                    font-size: 11px;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                }
                .med-detalle span {
                    font-size: 14px;
                    color: #333;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 2px solid #e9ecef;
                    text-align: center;
                }
                .firma {
                    margin-top: 60px;
                    text-align: center;
                }
                .firma-linea {
                    width: 300px;
                    border-top: 2px solid #333;
                    margin: 0 auto 10px;
                }
                .firma p {
                    color: #666;
                    font-size: 12px;
                }
                @media print {
                    body {
                        padding: 20px;
                    }
                    .medicamento {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐾 PawPOINT</h1>
                <p>Clínica Veterinaria</p>
                <p style="margin-top: 10px; font-size: 12px;">Receta Médica Veterinaria</p>
            </div>

            <div class="info-section">
                <div class="info-box">
                    <h3>Paciente</h3>
                    <p>${pacienteNombre}</p>
                    <p style="font-size: 14px; font-weight: normal; color: #666; margin-top: 5px;">${pacienteEspecie}</p>
                </div>
                <div class="info-box">
                    <h3>Fecha de Emisión</h3>
                    <p>${fechaHoy}</p>
                </div>
            </div>

            <div class="receta-section">
                <h2>📋 Prescripción Médica</h2>
    `;
    
    // Agregar cada medicamento
    medicamentos.forEach((med, index) => {
        htmlReceta += `
            <div class="medicamento">
                <h3>${index + 1}. ${med.nombre}</h3>
                <div class="med-detalles">
                    <div class="med-detalle">
                        <strong>Dosis</strong>
                        <span>${med.cantidad} ${med.unidad}</span>
                    </div>
                    <div class="med-detalle">
                        <strong>Frecuencia</strong>
                        <span>${med.frecuencia}</span>
                    </div>
                    <div class="med-detalle">
                        <strong>Duración</strong>
                        <span>${med.duracion ? med.duracion + ' días' : 'Continuo'}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    htmlReceta += `
            </div>

            <div class="footer">
                <p style="color: #666; font-size: 12px; margin-bottom: 10px;">
                    Esta receta es válida únicamente para el paciente indicado.<br>
                    Administrar según las indicaciones del veterinario.
                </p>
            </div>

            <div class="firma">
                <div class="firma-linea"></div>
                <p><strong>Firma y Sello del Veterinario</strong></p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;
    
    ventanaImpresion.document.write(htmlReceta);
    ventanaImpresion.document.close();
}
