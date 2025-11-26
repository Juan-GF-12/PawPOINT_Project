// core/static/core/js/tutores.js

let modalBootstrap = null;

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modal
    const tutorModalEl = document.getElementById('tutorModal');
    modalBootstrap = new bootstrap.Modal(tutorModalEl);
    
    // Cargar tutores
    cargarTutores();
    
    // Event listeners
    document.getElementById('btn-nuevo-tutor').addEventListener('click', abrirModalTutor);
    document.getElementById('tutor-form').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarTutor();
    });
});

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

function getAccessToken() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/login/';
    }
    return token;
}

// ============================================================================
// CARGAR Y RENDERIZAR TUTORES
// ============================================================================

async function cargarTutores() {
    const tableBody = document.getElementById('tutores-table-body');
    const accessToken = getAccessToken();
    
    try {
        const response = await fetch('/api/tutores/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar tutores');
        
        const tutores = await response.json();
        tableBody.innerHTML = '';
        
        if (tutores.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-10 text-white/60">
                        No hay tutores registrados.
                    </td>
                </tr>`;
            return;
        }
        
        tutores.forEach(tutor => {
            const row = document.createElement('tr');
            row.className = 'bg-white/5 hover:bg-white/10 transition';
            
            row.innerHTML = `
                <td class="p-4 rounded-l-xl text-white/80 font-mono">${tutor.rut}</td>
                <td class="p-4 text-white font-semibold">${tutor.nombre} ${tutor.apellido}</td>
                <td class="p-4 text-white/70">${tutor.telefono || 'N/A'}</td>
                <td class="p-4 text-white/70">${tutor.email}</td>
                <td class="p-4 rounded-r-xl">
                    <div class="flex justify-center gap-2">
                        <button onclick="verPacientesTutor(${tutor.id})" 
                                class="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition" 
                                title="Ver pacientes">
                            <i class="fas fa-paw"></i>
                        </button>
                        <button onclick="editarTutor(${tutor.id})" 
                                class="px-3 py-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 transition" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarTutor(${tutor.id}, '${tutor.nombre}')" 
                                class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 transition" 
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-10 text-red-400">
                    Error al cargar datos
                </td>
            </tr>`;
    }
}

// ============================================================================
// MODAL Y FORMULARIO
// ============================================================================

function abrirModalTutor() {
    document.getElementById('tutor-form').reset();
    document.getElementById('modal-alert-error-tutor').classList.add('hidden');
    modalBootstrap.show();
}

async function guardarTutor() {
    const accessToken = getAccessToken();
    
    const data = {
        rut: document.getElementById('tutor-rut').value,
        nombre: document.getElementById('tutor-nombre').value,
        apellido: document.getElementById('tutor-apellido').value,
        telefono: document.getElementById('tutor-telefono').value,
        email: document.getElementById('tutor-email').value,
        direccion: document.getElementById('tutor-direccion').value
    };
    
    const errorAlert = document.getElementById('modal-alert-error-tutor');
    const btnTexto = document.getElementById('btn-guardar-texto-tutor');
    const btnSpinner = document.getElementById('btn-guardar-spinner-tutor');
    
    errorAlert.classList.add('hidden');
    btnTexto.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/tutores/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }
        
        modalBootstrap.hide();
        cargarTutores();
        
    } catch (error) {
        errorAlert.textContent = 'Error al guardar. Verifica los datos.';
        errorAlert.classList.remove('hidden');
    } finally {
        btnTexto.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
    }
}

// ============================================================================
// ACCIONES
// ============================================================================

function verPacientesTutor(tutorId) {
    // Redirigir a pacientes con filtro
    window.location.href = `/pacientes/?tutor=${tutorId}`;
}

function editarTutor(tutorId) {
    alert('Función de edición en desarrollo');
}

async function eliminarTutor(tutorId, nombre) {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    const accessToken = getAccessToken();
    
    try {
        const response = await fetch(`/api/tutores/${tutorId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
        
        cargarTutores();
        
    } catch (error) {
        alert('Error al eliminar el tutor. Puede tener pacientes asociados.');
    }
}
