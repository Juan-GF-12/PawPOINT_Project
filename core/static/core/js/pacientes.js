// core/static/core/js/pacientes.js

// Variable global para la instancia del Modal de Bootstrap
let modalBootstrap = null;
let pacientesData = []; // Almacena todos los pacientes para búsqueda
let pacienteEditando = null; // ID del paciente que se está editando

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    
    // Inicializa la instancia del Modal
    const pacienteModalEl = document.getElementById('pacienteModal');
    modalBootstrap = new bootstrap.Modal(pacienteModalEl);
    
    // Carga la lista inicial de pacientes
    cargarPacientes();

    // 1. Event Listener para el botón "+ Nuevo Paciente"
    document.getElementById('btn-nuevo-paciente').addEventListener('click', function() {
        abrirModalPaciente();
    });

    // 2. Event Listener para el formulario del modal
    document.getElementById('paciente-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Evita envío tradicional
        guardarPaciente();
    });

    // 3. Event Listener para búsqueda en tiempo real
    document.getElementById('search-pacientes').addEventListener('input', function(event) {
        buscarPacientes(event.target.value);
    });
});

// --- FUNCIONES DE LA API ---

// Función para obtener el token (¡IMPORTANTE!)
function getAccessToken() {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        window.location.href = '/login/'; // Redirige si no hay token
    }
    return accessToken;
}

// Carga la lista de pacientes (GET)
async function cargarPacientes() {
    const tableBody = document.getElementById('pacientes-table-body');
    const loadingRow = document.getElementById('loading-row');
    const accessToken = getAccessToken();

    try {
        const response = await fetch('/api/pacientes/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (response.status === 401) {
            window.location.href = '/login/';
            return;
        }
        if (!response.ok) throw new Error('Error al cargar pacientes');

        const pacientes = await response.json();
        pacientesData = pacientes; // Guardar para búsqueda
        tableBody.innerHTML = ''; // Limpiar spinner

        pacientes.forEach(paciente => {
            agregarFilaPaciente(paciente); // Añade la fila a la tabla
        });

        if (pacientes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-white/60">No se encontraron pacientes.</td></tr>';
        }

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-red-400">Error al cargar datos.</td></tr>';
    }
}

// Carga la lista de tutores en el modal (GET)
async function cargarTutores() {
    const selectTutor = document.getElementById('paciente-tutor');
    const accessToken = getAccessToken();
    selectTutor.innerHTML = '<option value="">Cargando tutores...</option>';
    
    try {
        const response = await fetch('/api/tutores/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (!response.ok) throw new Error('Error al cargar tutores');
        
        const tutores = await response.json();
        selectTutor.innerHTML = '<option value="">Seleccione un tutor (*)</option>'; // Opción por defecto
        
        tutores.forEach(tutor => {
            const option = document.createElement('option');
            option.value = tutor.id;
            option.textContent = `${tutor.nombre} ${tutor.apellido} (${tutor.rut})`;
            selectTutor.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando tutores:', error);
        selectTutor.innerHTML = '<option value="">Error al cargar tutores</option>';
    }
}

// Abre el modal para nuevo paciente o editar
function abrirModalPaciente(pacienteId = null) {
    const form = document.getElementById('paciente-form');
    const modalTitulo = document.getElementById('modal-titulo');
    const errorAlert = document.getElementById('modal-alert-error');
    
    // Resetea el formulario
    form.reset();
    errorAlert.classList.add('hidden');
    pacienteEditando = pacienteId;
    
    if (pacienteId) {
        // Modo edición
        modalTitulo.textContent = 'Editar Paciente';
        document.getElementById('paciente-id').value = pacienteId;
        cargarDatosPaciente(pacienteId);
    } else {
        // Modo creación
        modalTitulo.textContent = 'Nuevo Paciente';
        document.getElementById('paciente-id').value = '';
    }
    
    // Carga los tutores frescos cada vez que se abre
    cargarTutores();
    
    // Muestra el modal
    modalBootstrap.show();
}

// Guarda el nuevo paciente (POST) o actualiza uno existente (PUT)
async function guardarPaciente() {
    const accessToken = getAccessToken();
    const pacienteId = document.getElementById('paciente-id').value;

    // 1. Obtener datos del formulario
    const tutorId = document.getElementById('paciente-tutor').value;
    const nombre = document.getElementById('paciente-nombre').value;
    const especie = document.getElementById('paciente-especie').value;
    const raza = document.getElementById('paciente-raza').value;
    const genero = document.getElementById('paciente-genero').value;
    const fechaNacimiento = document.getElementById('paciente-fecha-nacimiento').value;

    // 2. Referencias a botones y alertas
    const errorAlert = document.getElementById('modal-alert-error');
    const btnTexto = document.getElementById('btn-guardar-texto');
    const btnSpinner = document.getElementById('btn-guardar-spinner');

    // 3. Mostrar Spinner
    errorAlert.classList.add('hidden');
    btnTexto.classList.add('hidden');
    btnSpinner.classList.remove('hidden');

    try {
        // 4. Crear el objeto de datos
        const data = {
            tutor: tutorId,
            nombre: nombre,
            especie: especie,
            raza: raza,
            fecha_nacimiento: fechaNacimiento,
            genero: genero
        };

        // 5. Determinar método y URL
        const metodo = pacienteId ? 'PUT' : 'POST';
        const url = pacienteId ? `/api/pacientes/${pacienteId}/` : '/api/pacientes/';

        // 6. Enviar a la API
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error al guardar:', errorData);
            throw new Error('Datos inválidos');
        }

        const pacienteGuardado = await response.json();

        // 7. Éxito: Ocultar modal y recargar tabla
        modalBootstrap.hide();
        cargarPacientes(); // Recargar toda la tabla

    } catch (error) {
        // 8. Error: Mostrar alerta
        errorAlert.textContent = 'Error al guardar. Revisa los campos obligatorios.';
        errorAlert.classList.remove('hidden');
    } finally {
        // 9. Ocultar Spinner
        btnTexto.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
    }
}


// --- FUNCIONES UTILITARIAS ---

// Carga los datos de un paciente para edición
async function cargarDatosPaciente(pacienteId) {
    const accessToken = getAccessToken();
    
    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (!response.ok) throw new Error('Error al cargar paciente');
        
        const paciente = await response.json();
        
        // Llenar el formulario con los datos
        document.getElementById('paciente-tutor').value = paciente.tutor;
        document.getElementById('paciente-nombre').value = paciente.nombre;
        document.getElementById('paciente-especie').value = paciente.especie;
        document.getElementById('paciente-raza').value = paciente.raza || '';
        document.getElementById('paciente-genero').value = paciente.genero;
        document.getElementById('paciente-fecha-nacimiento').value = paciente.fecha_nacimiento;

    } catch (error) {
        console.error('Error cargando paciente:', error);
    }
}

// Busca pacientes en tiempo real
function buscarPacientes(query) {
    const tableBody = document.getElementById('pacientes-table-body');
    const busqueda = query.toLowerCase().trim();
    
    if (busqueda === '') {
        // Si no hay búsqueda, mostrar todos
        tableBody.innerHTML = '';
        pacientesData.forEach(paciente => agregarFilaPaciente(paciente));
        return;
    }
    
    // Filtrar pacientes
    const pacientesFiltrados = pacientesData.filter(paciente => {
        const nombre = paciente.nombre.toLowerCase();
        const especie = paciente.especie.toLowerCase();
        const raza = (paciente.raza || '').toLowerCase();
        const tutorNombre = paciente.tutor_nombre ? paciente.tutor_nombre.toLowerCase() : '';
        
        return nombre.includes(busqueda) || 
               especie.includes(busqueda) || 
               raza.includes(busqueda) ||
               tutorNombre.includes(busqueda);
    });
    
    // Mostrar resultados
    tableBody.innerHTML = '';
    if (pacientesFiltrados.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-white/60">No se encontraron resultados.</td></tr>';
    } else {
        pacientesFiltrados.forEach(paciente => agregarFilaPaciente(paciente));
    }
}

// Elimina un paciente
async function eliminarPaciente(pacienteId, nombrePaciente) {
    if (!confirm(`¿Estás seguro de eliminar a ${nombrePaciente}? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    const accessToken = getAccessToken();
    
    try {
        const response = await fetch(`/api/pacientes/${pacienteId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        if (!response.ok) throw new Error('Error al eliminar paciente');
        
        // Recargar la tabla
        cargarPacientes();

    } catch (error) {
        console.error('Error eliminando paciente:', error);
        alert('Error al eliminar el paciente. Puede tener registros asociados.');
    }
}

// Calcula la edad del paciente
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    const diffMs = hoy - nacimiento;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias < 30) {
        return `${diffDias} días`;
    } else if (diffDias < 365) {
        const meses = Math.floor(diffDias / 30);
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else {
        const años = Math.floor(diffDias / 365);
        const meses = Math.floor((diffDias % 365) / 30);
        return meses > 0 ? `${años}a ${meses}m` : `${años} ${años === 1 ? 'año' : 'años'}`;
    }
}

// Obtiene el ícono según la especie
function getIconoEspecie(especie) {
    const especieLower = especie.toLowerCase();
    if (especieLower.includes('perro') || especieLower.includes('canino')) {
        return '<i class="fas fa-dog text-blue-400"></i>';
    } else if (especieLower.includes('gato') || especieLower.includes('felino')) {
        return '<i class="fas fa-cat text-orange-400"></i>';
    } else if (especieLower.includes('ave') || especieLower.includes('pájaro')) {
        return '<i class="fas fa-dove text-yellow-400"></i>';
    } else if (especieLower.includes('conejo')) {
        return '<i class="fas fa-rabbit text-pink-400"></i>';
    } else if (especieLower.includes('pez')) {
        return '<i class="fas fa-fish text-cyan-400"></i>';
    } else {
        return '<i class="fas fa-paw text-gray-400"></i>';
    }
}

// Añade una fila a la tabla (reutilizable)
function agregarFilaPaciente(paciente) {
    const tableBody = document.getElementById('pacientes-table-body');
    
    // Si la tabla dice "No se encontraron pacientes", limpiarla
    if (tableBody.querySelector('td[colspan="8"]')) {
        tableBody.innerHTML = '';
    }

    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5 transition';
    
    const edad = calcularEdad(paciente.fecha_nacimiento);
    const icono = getIconoEspecie(paciente.especie);
    const generoTexto = paciente.genero === 'M' ? 'Macho' : 'Hembra';
    const tutorNombre = paciente.tutor_nombre || `ID: ${paciente.tutor}`;
    
    row.innerHTML = `
        <td class="p-5 text-white/60 font-mono">PAW-${String(paciente.id).padStart(3, '0')}</td>
        <td class="p-5">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    ${icono}
                </div>
                <span class="font-semibold text-white">${paciente.nombre}</span>
            </div>
        </td>
        <td class="p-5 text-white/80">${paciente.especie}</td>
        <td class="p-5 text-white/60">${paciente.raza || 'N/A'}</td>
        <td class="p-5 text-white/60">${generoTexto}</td>
        <td class="p-5 text-white/60">${edad}</td>
        <td class="p-5 text-white/60">${tutorNombre}</td>
        <td class="p-5">
            <div class="flex justify-center gap-2">
                <button onclick="window.location.href='/historial/?paciente_id=${paciente.id}'" 
                        class="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition" 
                        title="Ver historial médico">
                    <i class="fas fa-file-medical"></i>
                </button>
                <button onclick="abrirModalPaciente(${paciente.id})" 
                        class="px-3 py-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 transition" 
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarPaciente(${paciente.id}, '${paciente.nombre}')" 
                        class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 transition" 
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    tableBody.appendChild(row);
}