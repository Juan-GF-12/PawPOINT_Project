// core/static/core/js/tutores.js

let tutorActualId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Cargar tutores
    cargarTutores();
    
    // Event listeners
    document.getElementById('btn-nuevo-tutor').addEventListener('click', abrirModalNuevoTutor);
    document.getElementById('btn-close-modal').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancelar').addEventListener('click', cerrarModal);
    document.getElementById('tutor-form').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarTutor();
    });
    document.getElementById('btn-eliminar-tutor').addEventListener('click', function() {
        if (tutorActualId) {
            eliminarTutor(tutorActualId);
        }
    });
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('tutorModal').addEventListener('click', function(e) {
        if (e.target.id === 'tutorModal') {
            cerrarModal();
        }
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

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getAccessToken()
    };
}

// ============================================================================
// VALIDACIONES
// ============================================================================

function validarRUT(rut) {
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rut.length < 8 || rut.length > 9) {
        return false;
    }
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    let dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dv === dvCalculado;
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarTelefono(telefono) {
    // Permitir formato +56 9 1234 5678 o 912345678
    const regex = /^(\+?56)?[\s]?[9]\d{8}$/;
    return regex.test(telefono.replace(/\s/g, ''));
}

function limpiarErrores() {
    document.querySelectorAll('[id^="error-"]').forEach(error => {
        error.classList.add('hidden');
        error.textContent = '';
    });
}

function mostrarError(campo, mensaje) {
    const errorElement = document.getElementById(`error-${campo}`);
    if (errorElement) {
        errorElement.textContent = mensaje;
        errorElement.classList.remove('hidden');
    }
}

function validarFormulario() {
    limpiarErrores();
    let esValido = true;
    
    const rut = document.getElementById('tutor-rut').value.trim();
    const nombre = document.getElementById('tutor-nombre').value.trim();
    const apellido = document.getElementById('tutor-apellido').value.trim();
    const telefono = document.getElementById('tutor-telefono').value.trim();
    const email = document.getElementById('tutor-email').value.trim();
    
    // Validar campos obligatorios
    if (!rut) {
        mostrarError('rut', 'El RUT es obligatorio');
        esValido = false;
    } else if (!validarRUT(rut)) {
        mostrarError('rut', 'RUT inválido. Formato: 12.345.678-9');
        esValido = false;
    }
    
    if (!nombre) {
        mostrarError('nombre', 'El nombre es obligatorio');
        esValido = false;
    }
    
    if (!apellido) {
        mostrarError('apellido', 'El apellido es obligatorio');
        esValido = false;
    }
    
    if (!telefono) {
        mostrarError('telefono', 'El teléfono es obligatorio');
        esValido = false;
    } else if (!validarTelefono(telefono)) {
        mostrarError('telefono', 'Teléfono inválido. Formato: +56 9 1234 5678');
        esValido = false;
    }
    
    if (!email) {
        mostrarError('email', 'El email es obligatorio');
        esValido = false;
    } else if (!validarEmail(email)) {
        mostrarError('email', 'Email inválido');
        esValido = false;
    }
    
    return esValido;
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
                    <td colspan="6" class="text-center py-12 text-white/60">
                        <i class="fas fa-users text-4xl mb-3 opacity-50"></i>
                        <p class="text-lg">No hay tutores registrados.</p>
                        <p class="text-sm mt-2">Comienza agregando un nuevo tutor</p>
                    </td>
                </tr>`;
            return;
        }
        
        tutores.forEach(tutor => {
            const row = document.createElement('tr');
            row.className = 'bg-white/5 hover:bg-white/10 transition-all duration-200';
            
            row.innerHTML = `
                <td class="p-4 pl-6 rounded-l-xl text-white/80 font-mono text-sm">${tutor.rut}</td>
                <td class="p-4 text-white font-semibold">${tutor.nombre} ${tutor.apellido}</td>
                <td class="p-4 text-white/70"><i class="fas fa-phone mr-2 text-purple-400"></i>${tutor.telefono || 'N/A'}</td>
                <td class="p-4 text-white/70"><i class="fas fa-envelope mr-2 text-purple-400"></i>${tutor.email}</td>
                <td class="p-4 text-white/70 max-w-xs truncate">${tutor.direccion || 'Sin dirección'}</td>
                <td class="p-4 rounded-r-xl">
                    <div class="flex justify-center gap-2">
                        <button onclick="verPacientesTutor(${tutor.id}, '${tutor.nombre} ${tutor.apellido}')" 
                                class="px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition-all hover:scale-105" 
                                title="Ver pacientes">
                            <i class="fas fa-paw"></i>
                        </button>
                        <button onclick="editarTutor(${tutor.id})" 
                                class="px-3 py-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 transition-all hover:scale-105" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="confirmarEliminacion(${tutor.id}, '${tutor.nombre} ${tutor.apellido}')" 
                                class="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 transition-all hover:scale-105" 
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-12 text-red-400">
                    <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                    <p class="text-lg">Error al cargar datos</p>
                </td>
            </tr>`;
    }
}

// ============================================================================
// MODAL Y FORMULARIO
// ============================================================================

function abrirModalNuevoTutor() {
    tutorActualId = null;
    document.getElementById('tutor-form').reset();
    document.getElementById('tutor-id').value = '';
    limpiarErrores();
    
    document.getElementById('modal-title').innerHTML = `
        <i class="fas fa-user-plus text-purple-400"></i>
        <span>Registrar Nuevo Tutor</span>
    `;
    document.getElementById('btn-guardar-texto').textContent = 'Guardar Tutor';
    document.getElementById('btn-eliminar-tutor').classList.add('hidden');
    
    mostrarModal();
}

async function editarTutor(tutorId) {
    tutorActualId = tutorId;
    limpiarErrores();
    
    try {
        const response = await fetch(`/api/tutores/${tutorId}/`, {
            headers: {
                'Authorization': 'Bearer ' + getAccessToken()
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar tutor');
        
        const tutor = await response.json();
        
        // Llenar formulario
        document.getElementById('tutor-id').value = tutor.id;
        document.getElementById('tutor-rut').value = tutor.rut;
        document.getElementById('tutor-nombre').value = tutor.nombre;
        document.getElementById('tutor-apellido').value = tutor.apellido;
        document.getElementById('tutor-telefono').value = tutor.telefono;
        document.getElementById('tutor-email').value = tutor.email;
        document.getElementById('tutor-direccion').value = tutor.direccion || '';
        
        document.getElementById('modal-title').innerHTML = `
            <i class="fas fa-user-edit text-yellow-400"></i>
            <span>Editar Tutor: ${tutor.nombre} ${tutor.apellido}</span>
        `;
        document.getElementById('btn-guardar-texto').textContent = 'Actualizar Tutor';
        document.getElementById('btn-eliminar-tutor').classList.remove('hidden');
        
        mostrarModal();
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar la información del tutor',
            icon: 'error',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff'
        });
    }
}

function mostrarModal() {
    const modal = document.getElementById('tutorModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.remove('hidden');
    }, 10);
}

function cerrarModal() {
    const modal = document.getElementById('tutorModal');
    modal.classList.add('hidden');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    tutorActualId = null;
    document.getElementById('tutor-form').reset();
    limpiarErrores();
}

async function guardarTutor() {
    if (!validarFormulario()) {
        Swal.fire({
            title: 'Formulario incompleto',
            text: 'Por favor corrige los errores marcados en rojo',
            icon: 'warning',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff'
        });
        return;
    }
    
    const data = {
        rut: document.getElementById('tutor-rut').value.trim(),
        nombre: document.getElementById('tutor-nombre').value.trim(),
        apellido: document.getElementById('tutor-apellido').value.trim(),
        telefono: document.getElementById('tutor-telefono').value.trim(),
        email: document.getElementById('tutor-email').value.trim(),
        direccion: document.getElementById('tutor-direccion').value.trim()
    };
    
    const btnGuardar = document.getElementById('btn-guardar-tutor');
    const btnTexto = document.getElementById('btn-guardar-texto');
    const textoOriginal = btnTexto.textContent;
    
    btnGuardar.disabled = true;
    btnTexto.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
    
    try {
        const url = tutorActualId ? `/api/tutores/${tutorActualId}/` : '/api/tutores/';
        const method = tutorActualId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }
        
        cerrarModal();
        cargarTutores();
        
        Swal.fire({
            title: '¡Éxito!',
            text: tutorActualId ? 'Tutor actualizado correctamente' : 'Tutor registrado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff'
        });
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo guardar el tutor. Verifica que el RUT y email no estén duplicados.',
            icon: 'error',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff'
        });
    } finally {
        btnGuardar.disabled = false;
        btnTexto.textContent = textoOriginal;
    }
}

// ============================================================================
// ACCIONES
// ============================================================================

async function verPacientesTutor(tutorId, nombreTutor) {
    try {
        const response = await fetch(`/api/pacientes/?tutor=${tutorId}`, {
            headers: {
                'Authorization': 'Bearer ' + getAccessToken()
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar pacientes');
        
        const pacientes = await response.json();
        
        if (pacientes.length === 0) {
            Swal.fire({
                title: 'Sin pacientes',
                text: `${nombreTutor} no tiene mascotas registradas`,
                icon: 'info',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                color: '#fff'
            });
            return;
        }
        
        let html = '<div class="text-left">';
        pacientes.forEach(p => {
            html += `
                <div class="bg-white/10 p-3 rounded-lg mb-2">
                    <p class="font-bold text-white"><i class="fas fa-paw text-purple-400 mr-2"></i>${p.nombre}</p>
                    <p class="text-sm text-white/70">${p.especie} - ${p.raza || 'Sin raza'}</p>
                    <p class="text-xs text-white/50">Género: ${p.genero === 'M' ? 'Macho' : 'Hembra'}</p>
                </div>
            `;
        });
        html += '</div>';
        
        Swal.fire({
            title: `Mascotas de ${nombreTutor}`,
            html: html,
            icon: 'info',
            width: '600px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff',
            confirmButtonColor: '#9333ea'
        });
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los pacientes',
            icon: 'error',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff'
        });
    }
}

function confirmarEliminacion(tutorId, nombreTutor) {
    Swal.fire({
        title: '¿Eliminar este tutor?',
        html: `
            <p class="text-white/80 mb-3">¿Estás seguro de eliminar a <strong>${nombreTutor}</strong>?</p>
            <p class="text-red-400 text-sm">⚠️ Se eliminarán también todas sus mascotas y citas asociadas.</p>
            <p class="text-white/60 text-sm mt-2">Esta acción no se puede deshacer.</p>
        `,
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
            eliminarTutor(tutorId);
        }
    });
}

async function eliminarTutor(tutorId) {
    try {
        const response = await fetch(`/api/tutores/${tutorId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + getAccessToken()
            }
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
        
        cerrarModal();
        cargarTutores();
        
        Swal.fire({
            title: '¡Eliminado!',
            text: 'El tutor y sus datos asociados han sido eliminados',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff'
        });
        
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar el tutor. Puede tener datos asociados.',
            icon: 'error',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
            color: '#fff'
        });
    }
}
