/**
 * Portal del Tutor - Lógica de Carga
 * Carga datos del usuario, próxima cita y mascotas
 */

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('accessToken');
    if (!token) { 
        window.location.href = '/login/'; 
        return; 
    }

    cargarUsuario();
    cargarProximaCita();
    cargarMascotas();
});

function getHeaders() {
    return { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') };
}

// 1. Cargar Nombre del Usuario
async function cargarUsuario() {
    const res = await fetch('/api/me/', { headers: getHeaders() });
    const user = await res.json();
    if (user.username) {
        document.getElementById('user-name').textContent = `Hola, ${user.first_name || user.username}`;
    }
}

// 2. Cargar Próxima Cita (Lógica de filtrado)
async function cargarProximaCita() {
    const container = document.getElementById('proxima-cita-container');
    const res = await fetch('/api/citas/', { headers: getHeaders() });
    const citas = await res.json();

    // Filtrar futuras y ordenar
    const ahora = new Date();
    const futuras = citas.filter(c => new Date(c.fecha_hora) > ahora);
    futuras.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

    if (futuras.length > 0) {
        const cita = futuras[0];
        const fecha = new Date(cita.fecha_hora).toLocaleDateString('es-CL', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        container.innerHTML = `
            <div class="card border-primary shadow-sm">
                <div class="card-body">
                    <h5 class="card-title text-primary fw-bold">${fecha}</h5>
                    <p class="card-text mb-1"><strong>Paciente:</strong> ${cita.paciente_nombre || 'Tu mascota'}</p>
                    <p class="card-text mb-1"><strong>Motivo:</strong> ${cita.motivo || 'Consulta'}</p>
                    <span class="badge bg-warning text-dark">Pendiente</span>
                </div>
            </div>`;
    } else {
        container.innerHTML = `<div class="alert alert-secondary">No tienes citas programadas.</div>`;
    }
}

// 3. Cargar Mascotas
async function cargarMascotas() {
    const container = document.getElementById('mis-mascotas-container');
    const res = await fetch('/api/pacientes/', { headers: getHeaders() });
    const pacientes = await res.json();

    container.innerHTML = '';
    pacientes.forEach(p => {
        container.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body d-flex align-items-center">
                        <div class="bg-light rounded-circle p-3 me-3">
                            <i class="fas fa-paw fa-2x text-secondary"></i>
                        </div>
                        <div>
                            <h5 class="fw-bold mb-1">${p.nombre}</h5>
                            <p class="text-muted small mb-2">${p.especie} - ${p.raza || ''}</p>
                            <a href="/historial/?paciente_id=${p.id}" class="btn btn-sm btn-outline-primary">Ver Historial</a>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

// 4. Logout
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login/';
}
