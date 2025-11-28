/**
 * Portal del Tutor - Mobile App Style
 * Carga datos del usuario, próxima cita, recetas digitales y mascotas
 */

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('accessToken');
    if (!token) { 
        window.location.href = '/login/'; 
        return; 
    }

    cargarUsuario();
    cargarProximaCita();
    cargarRecetasDigitales();
    cargarMascotas();
});

function getHeaders() {
    return { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') };
}

// ============================================================================
// 1. CARGAR USUARIO CON SALUDO PERSONALIZADO
// ============================================================================

async function cargarUsuario() {
    try {
        const res = await fetch('/api/me/', { headers: getHeaders() });
        const user = await res.json();
        
        if (user.username) {
            const nombre = user.first_name || user.username;
            const hora = new Date().getHours();
            let saludo = '¡Hola';
            
            if (hora < 12) saludo = '¡Buenos días';
            else if (hora < 20) saludo = '¡Buenas tardes';
            else saludo = '¡Buenas noches';
            
            document.getElementById('user-greeting').textContent = `${saludo}, ${nombre}! 👋`;
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
    }
}

// ============================================================================
// 2. CARGAR PRÓXIMA CITA CON DISEÑO DESTACADO
// ============================================================================

async function cargarProximaCita() {
    const container = document.getElementById('proxima-cita-container');
    
    try {
        const res = await fetch('/api/citas/', { headers: getHeaders() });
        const citas = await res.json();

        // Filtrar futuras y ordenar
        const ahora = new Date();
        const futuras = citas.filter(c => new Date(c.fecha_hora) > ahora);
        futuras.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

        if (futuras.length > 0) {
            const cita = futuras[0];
            const fechaObj = new Date(cita.fecha_hora);
            
            const fecha = fechaObj.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long'
            });
            
            const hora = fechaObj.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Calcular días restantes
            const diasRestantes = Math.ceil((fechaObj - ahora) / (1000 * 60 * 60 * 24));
            const textoProximidad = diasRestantes === 0 ? 'HOY' : 
                                   diasRestantes === 1 ? 'MAÑANA' : 
                                   `EN ${diasRestantes} DÍAS`;
            
            container.innerHTML = `
                <div class="proxima-cita-card">
                    <div class="cita-fecha-badge">
                        <i class="fas fa-calendar-check"></i>
                        <span>${textoProximidad}</span>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">
                        ${fecha}
                    </h3>
                    <div class="cita-info">
                        <p style="margin-bottom: 0.5rem;">
                            <i class="fas fa-clock me-2"></i><strong>${hora}</strong>
                        </p>
                        <p style="margin-bottom: 0.5rem;">
                            <i class="fas fa-paw me-2"></i><strong>${cita.paciente_nombre || 'Tu mascota'}</strong>
                        </p>
                        <p style="margin-bottom: 0;">
                            <i class="fas fa-notes-medical me-2"></i>${cita.motivo || 'Consulta general'}
                        </p>
                    </div>
                    <button class="btn-ver-detalle" onclick="verDetalleCita(${cita.id})">
                        <i class="fas fa-arrow-right me-2"></i>Ver Detalles
                    </button>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="card-glass">
                    <div class="card-body-glass empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-calendar-times"></i>
                        </div>
                        <p class="empty-state-text">No tienes citas programadas</p>
                        <button class="btn-primary-gradient mt-3" onclick="agendarCita()">
                            <i class="fas fa-plus me-2"></i>Agendar Cita
                        </button>
                    </div>
                </div>`;
        }
    } catch (error) {
        console.error('Error cargando próxima cita:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar la próxima cita. Por favor, intenta nuevamente.
            </div>`;
    }
}

// ============================================================================
// 3. CARGAR RECETAS DIGITALES (Nueva Funcionalidad)
// ============================================================================

async function cargarRecetasDigitales() {
    const section = document.getElementById('receta-digital-section');
    const container = document.getElementById('recetas-container');
    
    try {
        // Obtener todas las mascotas del tutor
        const resPacientes = await fetch('/api/pacientes/', { headers: getHeaders() });
        const pacientes = await resPacientes.json();
        
        let todasRecetas = [];
        
        // Para cada paciente, obtener sus fichas clínicas
        for (const paciente of pacientes) {
            const resFichas = await fetch(`/api/ficha-clinica/?paciente=${paciente.id}`, { 
                headers: getHeaders() 
            });
            const fichas = await resFichas.json();
            
            // Para cada ficha, obtener tratamientos
            for (const ficha of fichas) {
                const resTratamientos = await fetch(`/api/tratamientos/?ficha_clinica=${ficha.id}`, {
                    headers: getHeaders()
                });
                const tratamientos = await resTratamientos.json();
                
                // Filtrar tratamientos activos (fecha_fin >= hoy o sin fecha_fin)
                const ahora = new Date();
                const activos = tratamientos.filter(t => {
                    if (!t.fecha_fin) return true;
                    return new Date(t.fecha_fin) >= ahora;
                });
                
                if (activos.length > 0) {
                    todasRecetas.push({
                        paciente: paciente.nombre,
                        tratamientos: activos
                    });
                }
            }
        }
        
        if (todasRecetas.length > 0) {
            section.style.display = 'block';
            container.innerHTML = '';
            
            todasRecetas.forEach(receta => {
                receta.tratamientos.forEach(t => {
                    const fechaInicio = new Date(t.fecha_inicio).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    const fechaFin = t.fecha_fin ? 
                        new Date(t.fecha_fin).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        }) : 'Continuo';
                    
                    container.innerHTML += `
                        <div class="receta-item slide-in-right animation-delay-${Math.min(todasRecetas.indexOf(receta) + 1, 4)}">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <div class="receta-medicamento">${t.medicamento}</div>
                                    <div class="receta-dosis">
                                        <i class="fas fa-pills me-1"></i>${t.descripcion || 'Sin descripción'}
                                    </div>
                                </div>
                                <span class="badge-status badge-info">
                                    <i class="fas fa-paw"></i>${receta.paciente}
                                </span>
                            </div>
                            <div class="receta-fecha">
                                <i class="fas fa-calendar"></i>
                                ${fechaInicio} → ${fechaFin}
                            </div>
                        </div>`;
                });
            });
        } else {
            section.style.display = 'none';
        }
    } catch (error) {
        console.error('Error cargando recetas digitales:', error);
        section.style.display = 'none';
    }
}

// ============================================================================
// 4. CARGAR MASCOTAS CON DISEÑO MOBILE APP
// ============================================================================

async function cargarMascotas() {
    const container = document.getElementById('mis-mascotas-container');
    
    try {
        const res = await fetch('/api/pacientes/', { headers: getHeaders() });
        const pacientes = await res.json();

        container.innerHTML = '';
        
        if (pacientes.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fas fa-paw"></i>
                        </div>
                        <p class="empty-state-text">Aún no tienes mascotas registradas</p>
                    </div>
                </div>`;
            return;
        }
        
        pacientes.forEach((p, index) => {
            const iconoEspecie = obtenerIconoEspecie(p.especie);
            const colorGradient = obtenerColorGradiente(p.especie);
            const animationDelay = Math.min(index + 2, 4);
            
            container.innerHTML += `
                <div class="col-md-6 col-lg-4 fade-in-up animation-delay-${animationDelay}">
                    <div class="mascota-card" onclick="verHistorialMascota(${p.id})">
                        <div class="mascota-avatar" style="background: ${colorGradient};">
                            ${iconoEspecie}
                        </div>
                        <div class="mascota-info">
                            <div class="mascota-nombre">${p.nombre}</div>
                            <div class="mascota-especie">${p.especie} ${p.raza ? '• ' + p.raza : ''}</div>
                            ${p.chip_id ? `
                                <div class="mascota-chip">
                                    <i class="fas fa-microchip"></i>
                                    <span>${p.chip_id}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.error('Error cargando mascotas:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar tus mascotas. Por favor, intenta nuevamente.',
            confirmButtonColor: '#0061ff'
        });
    }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function obtenerIconoEspecie(especie) {
    const iconos = {
        'Perro': '<i class="fas fa-dog"></i>',
        'Gato': '<i class="fas fa-cat"></i>',
        'Ave': '<i class="fas fa-dove"></i>',
        'Conejo': '<i class="fas fa-rabbit"></i>',
        'Reptil': '<i class="fas fa-dragon"></i>',
        'Roedor': '<i class="fas fa-otter"></i>'
    };
    return iconos[especie] || '<i class="fas fa-paw"></i>';
}

function obtenerColorGradiente(especie) {
    const colores = {
        'Perro': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'Gato': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'Ave': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'Conejo': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'Reptil': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'Roedor': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    };
    return colores[especie] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

// ============================================================================
// FUNCIONES DE NAVEGACIÓN
// ============================================================================

function verHistorialMascota(pacienteId) {
    window.location.href = `/historial/?paciente_id=${pacienteId}`;
}

function verDetalleCita(citaId) {
    Swal.fire({
        icon: 'info',
        title: 'Detalle de Cita',
        text: 'Funcionalidad en desarrollo. Próximamente podrás ver detalles completos de tu cita.',
        confirmButtonColor: '#0061ff'
    });
}

function agendarCita() {
    Swal.fire({
        icon: 'info',
        title: 'Agendar Cita',
        text: 'Para agendar una cita, por favor contacta directamente con la clínica.',
        confirmButtonColor: '#0061ff'
    });
}

// ============================================================================
// LOGOUT
// ============================================================================

function logout() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro que deseas salir?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#0061ff',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login/';
        }
    });
}
