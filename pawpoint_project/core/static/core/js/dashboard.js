/**
 * DASHBOARD VETERINARIO
 * 
 * Este módulo gestiona el dashboard principal del veterinario.
 * Incluye:
 * - Carga de citas del día en orden cronológico
 * - Estadísticas rápidas
 * - Navegación directa a historiales
 */

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    cargarFechaHoy();
    cargarDatosUsuario();
    cargarCitasDeHoy();
    cargarEstadisticas();
});

// ============================================================================
// FUNCIONES DE CARGA DE DATOS
// ============================================================================

/**
 * Muestra la fecha actual formateada
 */
function cargarFechaHoy() {
    const hoy = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);
    document.getElementById('fecha-hoy').textContent = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
}

/**
 * Carga los datos del usuario actual
 */
async function cargarDatosUsuario() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login/';
        return;
    }

    try {
        const response = await fetch('/api/me/', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('No autorizado');
        }

        const user = await response.json();
        document.getElementById('user-name').textContent = `Dr. ${user.first_name || user.username}`;
        document.getElementById('user-rol').textContent = user.rol || 'Veterinario';
    } catch (error) {
        console.error('Error cargando usuario:', error);
        window.location.href = '/login/';
    }
}

/**
 * Carga las citas programadas para hoy
 */
async function cargarCitasDeHoy() {
    const token = localStorage.getItem('accessToken');
    const container = document.getElementById('citas-hoy-container');
    const loading = document.getElementById('loading-citas');
    const sinCitas = document.getElementById('sin-citas-hoy');

    try {
        const response = await fetch('/api/citas/', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('Error al cargar citas');
        }

        const todasLasCitas = await response.json();
        
        // Filtrar solo las citas de hoy
        const hoy = new Date();
        const citasHoy = todasLasCitas.filter(cita => {
            const fechaCita = new Date(cita.fecha_hora);
            return fechaCita.toDateString() === hoy.toDateString();
        });

        // Ordenar por hora
        citasHoy.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

        loading.classList.add('hidden');

        if (citasHoy.length === 0) {
            sinCitas.classList.remove('hidden');
            document.getElementById('stat-citas-hoy').textContent = '0';
            return;
        }

        // Actualizar contador
        document.getElementById('stat-citas-hoy').textContent = citasHoy.length;

        // Renderizar citas
        container.innerHTML = '';
        citasHoy.forEach(cita => {
            const tarjeta = crearTarjetaCita(cita);
            container.appendChild(tarjeta);
        });

    } catch (error) {
        console.error('Error:', error);
        loading.innerHTML = `
            <div class="glass-panel p-8 rounded-2xl text-center">
                <i class="fas fa-exclamation-circle text-red-400 text-3xl mb-3"></i>
                <p class="text-white/60">Error al cargar las citas</p>
            </div>
        `;
    }
}

/**
 * Crea una tarjeta de cita con toda la información
 */
function crearTarjetaCita(cita) {
    const div = document.createElement('div');
    div.className = 'glass-panel p-5 rounded-2xl hover:bg-white/10 transition transform hover:-translate-y-1';
    
    const fecha = new Date(cita.fecha_hora);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    // Determinar icono según especie
    const iconoEspecie = obtenerIconoEspecie(cita.paciente_especie);
    const colorEspecie = obtenerColorEspecie(cita.paciente_especie);
    
    // Determinar estado
    const estadoBadge = obtenerEstadoBadge(cita.estado);
    
    div.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <div class="text-center">
                    <div class="text-3xl font-bold text-white">${hora}</div>
                    <div class="text-xs text-white/50">Hora</div>
                </div>
                <div class="h-12 w-px bg-white/20"></div>
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full ${colorEspecie} flex items-center justify-center text-white text-xl">
                        ${iconoEspecie}
                    </div>
                    <div>
                        <h4 class="text-white font-bold text-lg">${cita.paciente_nombre}</h4>
                        <p class="text-white/60 text-sm">${cita.paciente_especie} • ${cita.tutor_nombre || 'Sin tutor'}</p>
                    </div>
                </div>
            </div>
            ${estadoBadge}
        </div>
        
        <div class="mb-4 p-3 rounded-lg bg-white/5">
            <div class="flex items-start gap-2">
                <i class="fas fa-clipboard-list text-blue-400 mt-1"></i>
                <div>
                    <p class="text-white/60 text-xs">Motivo</p>
                    <p class="text-white text-sm">${cita.motivo || 'No especificado'}</p>
                </div>
            </div>
        </div>
        
        <button onclick="atenderPaciente(${cita.paciente})" class="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2">
            <i class="fas fa-notes-medical"></i>
            <span>Ir a Historial / Atender</span>
        </button>
    `;
    
    return div;
}

/**
 * Obtiene el icono según la especie
 */
function obtenerIconoEspecie(especie) {
    const iconos = {
        'Perro': '<i class="fas fa-dog"></i>',
        'Gato': '<i class="fas fa-cat"></i>',
        'Ave': '<i class="fas fa-dove"></i>',
        'Conejo': '<i class="fas fa-rabbit"></i>',
        'Roedor': '<i class="fas fa-mouse"></i>',
        'Reptil': '<i class="fas fa-dragon"></i>'
    };
    return iconos[especie] || '<i class="fas fa-paw"></i>';
}

/**
 * Obtiene el color según la especie
 */
function obtenerColorEspecie(especie) {
    const colores = {
        'Perro': 'bg-blue-600',
        'Gato': 'bg-orange-600',
        'Ave': 'bg-yellow-600',
        'Conejo': 'bg-pink-600',
        'Roedor': 'bg-gray-600',
        'Reptil': 'bg-green-600'
    };
    return colores[especie] || 'bg-purple-600';
}

/**
 * Obtiene el badge de estado
 */
function obtenerEstadoBadge(estado) {
    const estados = {
        'Programada': '<span class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">Programada</span>',
        'Confirmada': '<span class="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">Confirmada</span>',
        'Completada': '<span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">Completada</span>',
        'Cancelada': '<span class="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold">Cancelada</span>'
    };
    return estados[estado] || estados['Programada'];
}

/**
 * Redirige al historial del paciente
 */
function atenderPaciente(pacienteId) {
    window.location.href = `/historial/?paciente_id=${pacienteId}`;
}

/**
 * Carga las estadísticas del dashboard
 */
async function cargarEstadisticas() {
    const token = localStorage.getItem('accessToken');

    try {
        // Cargar pacientes
        const responsePacientes = await fetch('/api/pacientes/', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const pacientes = await responsePacientes.json();
        document.getElementById('stat-pacientes').textContent = pacientes.length;

        // Cargar citas pendientes (futuras)
        const responseCitas = await fetch('/api/citas/', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const citas = await responseCitas.json();
        const ahora = new Date();
        const citasPendientes = citas.filter(c => new Date(c.fecha_hora) > ahora);
        document.getElementById('stat-pendientes').textContent = citasPendientes.length;

        // Cargar tratamientos activos
        const responseTratamientos = await fetch('/api/tratamientos/', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const tratamientos = await responseTratamientos.json();
        const hoy = new Date();
        const tratamientosActivos = tratamientos.filter(t => {
            if (!t.fecha_fin) return true;
            return new Date(t.fecha_fin) >= hoy;
        });
        const pacientesUnicos = new Set(tratamientosActivos.map(t => t.ficha_clinica));
        document.getElementById('stat-tratamientos').textContent = pacientesUnicos.size;

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}
