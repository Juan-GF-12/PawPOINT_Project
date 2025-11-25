/**
 * PORTAL DEL TUTOR - Script de Gestión
 * 
 * Este módulo gestiona la interfaz del portal exclusivo para tutores.
 * Se encarga de:
 * - Cargar y mostrar las mascotas del tutor
 * - Mostrar próximas citas
 * - Manejar logout del usuario
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

const mascotas_container = document.getElementById('mascotas-container');
const citas_container = document.getElementById('citas-container');

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

/**
 * Cierra la sesión del tutor y redirige al login.
 */
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login/';
}

// ============================================================================
// FUNCIONES DE CARGA DE DATOS
// ============================================================================

/**
 * Carga los datos del usuario actual para mostrar su nombre.
 */
async function cargarDatosUsuario() {
    const headers = getHeaders();
    if (!headers) return;

    try {
        const response = await fetch('/api/me/', { headers });
        if (!response.ok) throw new Error('No se pudieron cargar datos del usuario');

        const usuario = await response.json();
        
        // Actualizar saludo con el nombre del usuario
        const nombreCompleto = usuario.first_name || usuario.username;
        document.getElementById('nombre-tutor').textContent = nombreCompleto;
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
    }
}

/**
 * Carga las mascotas del tutor desde la API.
 * 
 * El backend filtra automáticamente para mostrar solo las mascotas
 * del tutor autenticado.
 */
async function cargarMascotas() {
    const headers = getHeaders();
    if (!headers) return;

    try {
        const response = await fetch('/api/pacientes/', { headers });
        if (!response.ok) throw new Error('No se pudieron cargar mascotas');

        const mascotas = await response.json();

        // Actualizar contador de mascotas
        document.getElementById('contador-mascotas').textContent = 
            mascotas.length > 0 ? `${mascotas.length} mascota(s)` : 'Sin mascotas';

        // Limpiar contenedor
        mascotas_container.innerHTML = '';

        if (mascotas.length === 0) {
            mascotas_container.innerHTML = `
                <div class="col-span-full text-center py-8 text-white/60">
                    <i class="fas fa-inbox text-3xl mb-3"></i>
                    <p>No tienes mascotas registradas aún</p>
                </div>
            `;
            return;
        }

        // Renderizar tarjetas de mascotas
        mascotas.forEach(mascota => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'glass-panel rounded-xl p-4 hover:bg-white/5 transition';
            
            // Determinar emoji según especie
            let emoji = '🐾';
            if (mascota.especie.toLowerCase().includes('perro')) emoji = '🐕';
            else if (mascota.especie.toLowerCase().includes('gato')) emoji = '🐱';
            else if (mascota.especie.toLowerCase().includes('pajaro') || mascota.especie.toLowerCase().includes('ave')) emoji = '🐦';
            else if (mascota.especie.toLowerCase().includes('conejo')) emoji = '🐰';

            const fechaNacimiento = new Date(mascota.fecha_nacimiento);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

            tarjeta.innerHTML = `
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <p class="text-2xl">${emoji}</p>
                        <h3 class="text-lg font-bold text-white mt-1">${mascota.nombre}</h3>
                        <p class="text-sm text-blue-300">${mascota.especie}</p>
                    </div>
                    <a href="/historial/?paciente_id=${mascota.id}" class="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition">
                        Ver Historial
                    </a>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs text-white/70 border-t border-white/10 pt-3 mt-3">
                    <div>
                        <span class="text-white/50">Raza:</span>
                        <p class="text-white">${mascota.raza || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-white/50">Género:</span>
                        <p class="text-white">${mascota.genero === 'M' ? 'Macho' : 'Hembra'}</p>
                    </div>
                    <div>
                        <span class="text-white/50">Edad:</span>
                        <p class="text-white">${edad} año(s)</p>
                    </div>
                </div>
            `;
            
            mascotas_container.appendChild(tarjeta);
        });

    } catch (error) {
        console.error('Error cargando mascotas:', error);
        mascotas_container.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-300">
                <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p>Error al cargar mascotas</p>
            </div>
        `;
    }
}

/**
 * Carga las próximas citas del tutor desde la API.
 * 
 * El backend filtra automáticamente para mostrar solo citas
 * de las mascotas del tutor.
 */
async function cargarCitas() {
    const headers = getHeaders();
    if (!headers) return;

    try {
        const response = await fetch('/api/citas/', { headers });
        if (!response.ok) throw new Error('No se pudieron cargar citas');

        const citas = await response.json();

        // Filtrar solo citas futuras y ordenaras por fecha
        const ahora = new Date();
        const citasFuturas = citas
            .filter(cita => new Date(cita.fecha_hora) > ahora)
            .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
            .slice(0, 5); // Mostrar solo las próximas 5

        // Limpiar contenedor
        citas_container.innerHTML = '';

        if (citasFuturas.length === 0) {
            citas_container.innerHTML = `
                <div class="text-center py-8 text-white/60">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>No tienes citas próximas programadas</p>
                </div>
            `;
            return;
        }

        // Renderizar tarjetas de citas
        citasFuturas.forEach(cita => {
            const fecha = new Date(cita.fecha_hora);
            const fechaFormato = fecha.toLocaleDateString('es-ES', 
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const horaFormato = fecha.toLocaleTimeString('es-ES', 
                { hour: '2-digit', minute: '2-digit' });

            // Color según estado
            let colorEstado = 'bg-yellow-500/20 text-yellow-300';
            if (cita.estado === 'CONFIRMADA') colorEstado = 'bg-green-500/20 text-green-300';
            else if (cita.estado === 'CANCELADA') colorEstado = 'bg-red-500/20 text-red-300';

            const tarjeta = document.createElement('div');
            tarjeta.className = 'glass-panel rounded-lg p-4 flex justify-between items-start';
            tarjeta.innerHTML = `
                <div>
                    <p class="text-sm text-blue-300">📅 ${fechaFormato}</p>
                    <h3 class="text-lg font-bold text-white mt-1">${cita.paciente_nombre || 'Mascota'}</h3>
                    <p class="text-sm text-white/70 mt-1">
                        <i class="fas fa-clock"></i> ${horaFormato}
                    </p>
                    <p class="text-sm text-white/70">
                        <i class="fas fa-stethoscope"></i> ${cita.motivo || 'Sin motivo especificado'}
                    </p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colorEstado}">
                    ${cita.estado}
                </span>
            `;
            
            citas_container.appendChild(tarjeta);
        });

    } catch (error) {
        console.error('Error cargando citas:', error);
        citas_container.innerHTML = `
            <div class="text-center py-8 text-red-300">
                <i class="fas fa-exclamation-circle text-xl mb-2"></i>
                <p>Error al cargar citas</p>
            </div>
        `;
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el portal al cargar la página.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar token
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login/';
        return;
    }

    // Cargar datos
    await cargarDatosUsuario();
    await cargarMascotas();
    await cargarCitas();
});

// Permitir logout desde la consola si es necesario
window.logout = logout;
