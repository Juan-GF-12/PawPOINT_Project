// core/static/core/js/pacientes.js

// Variable global para la instancia del Modal de Bootstrap
let modalBootstrap = null;

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    
    // Inicializa la instancia del Modal
    const pacienteModalEl = document.getElementById('pacienteModal');
    modalBootstrap = new bootstrap.Modal(pacienteModalEl);
    
    // Carga la lista inicial de pacientes
    cargarPacientes();

    // 1. Event Listener para el botón "+ Ingresar Paciente"
    document.getElementById('btn-nuevo-paciente').addEventListener('click', function() {
        abrirModalPaciente();
    });

    // 2. Event Listener para el formulario del modal
    document.getElementById('paciente-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Evita envío tradicional
        guardarPaciente();
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
        tableBody.innerHTML = ''; // Limpiar spinner

        pacientes.forEach(paciente => {
            agregarFilaPaciente(paciente); // Añade la fila a la tabla
        });

        if (pacientes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron pacientes.</td></tr>';
        }

    } catch (error) {
        console.error('Error:', error);
        loadingRow.innerHTML = '<td colspan="6" class="text-center text-danger">Error al cargar datos.</td>';
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

// Abre el modal y carga los tutores
function abrirModalPaciente() {
    // Resetea el formulario
    document.getElementById('paciente-form').reset();
    document.getElementById('modal-alert-error').classList.add('d-none');
    
    // Carga los tutores frescos cada vez que se abre
    cargarTutores();
    
    // Muestra el modal
    modalBootstrap.show();
}

// Guarda el nuevo paciente (POST)
async function guardarPaciente() {
    const accessToken = getAccessToken();

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
    errorAlert.classList.add('d-none');
    btnTexto.classList.add('d-none');
    btnSpinner.classList.remove('d-none');

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

        // 5. Enviar a la API
        const response = await fetch('/api/pacientes/', {
            method: 'POST',
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

        const nuevoPaciente = await response.json();

        // 6. Éxito: Ocultar modal y añadir a la tabla
        modalBootstrap.hide();
        agregarFilaPaciente(nuevoPaciente); // Añade el nuevo paciente a la tabla

    } catch (error) {
        // 7. Error: Mostrar alerta
        errorAlert.textContent = 'Error al guardar. Revisa los campos obligatorios.';
        errorAlert.classList.remove('d-none');
    } finally {
        // 8. Ocultar Spinner
        btnTexto.classList.remove('d-none');
        btnSpinner.classList.add('d-none');
    }
}


// --- FUNCIONES UTILITARIAS ---

// Añade una fila a la tabla (reutilizable)
function agregarFilaPaciente(paciente) {
    const tableBody = document.getElementById('pacientes-table-body');
    
    // Si la tabla dice "No se encontraron pacientes", limpiarla
    if (tableBody.querySelector('td[colspan="6"]')) {
        tableBody.innerHTML = '';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>PAW-${paciente.id}</td>
        <td><strong>${paciente.nombre}</strong></td>
        <td>${paciente.especie}</td>
        <td>${paciente.raza || 'N/A'}</td>
        <td>Tutor ID: ${paciente.tutor}</td>
        <td>
            <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
            <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-edit"></i></button>
        </td>
    `;
    tableBody.appendChild(row);
}