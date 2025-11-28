// core/static/core/js/pacientes.js - Versión 2.0 con Formulario Desplegable
// Última actualización: 2025-11-26

let pacientesData = []; // Almacena todos los pacientes para búsqueda
let pacienteEditando = null; // ID del paciente que se está editando

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    
    // Carga la lista inicial de pacientes
    cargarPacientes();

    // 1. Event Listener para el botón "+ Nuevo Paciente"
    document.getElementById('btn-nuevo-paciente').addEventListener('click', function() {
        abrirFormulario();
    });

    // 2. Event Listener para cerrar el formulario
    document.getElementById('btn-cerrar-formulario').addEventListener('click', function() {
        cerrarFormulario();
    });

    // 3. Event Listener para cancelar el formulario
    document.getElementById('btn-cancelar-form').addEventListener('click', function() {
        cerrarFormulario();
    });

    // 4. Event Listener para el formulario del modal
    document.getElementById('paciente-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Evita envío tradicional
        guardarPaciente();
    });

    // 5. Event Listener para búsqueda en tiempo real
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
            option.style.color = '#1f2937'; // Color oscuro para que se vea en el dropdown
            selectTutor.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando tutores:', error);
        selectTutor.innerHTML = '<option value="">Error al cargar tutores</option>';
    }
}

// Abre el formulario desplegable (nuevo o editar)
async function abrirFormulario(pacienteId = null) {
    const formularioContainer = document.getElementById('formulario-container');
    const formularioTitulo = document.getElementById('formulario-titulo');
    const form = document.getElementById('paciente-form');
    const errorAlert = document.getElementById('form-alert-error');
    
    // Resetea el formulario
    form.reset();
    errorAlert.classList.add('hidden');
    limpiarErrores();
    pacienteEditando = pacienteId;
    
    if (pacienteId) {
        // Modo edición
        formularioTitulo.innerHTML = '<i class="fas fa-edit mr-2"></i>Editar Paciente';
        document.getElementById('paciente-id').value = pacienteId;
    } else {
        // Modo creación
        formularioTitulo.innerHTML = '<i class="fas fa-paw mr-2"></i>Nuevo Paciente';
        document.getElementById('paciente-id').value = '';
    }
    
    // Carga los tutores frescos cada vez que se abre
    await cargarTutores();
    
    // Si es modo edición, cargar los datos DESPUÉS de cargar los tutores
    if (pacienteId) {
        await cargarDatosPaciente(pacienteId);
    }
    
    // Anima la apertura del formulario
    formularioContainer.style.maxHeight = '1000px';
    formularioContainer.style.opacity = '1';
    formularioContainer.style.marginBottom = '1.5rem';
    
    // Scroll suave al formulario
    setTimeout(() => {
        formularioContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Cierra el formulario desplegable
function cerrarFormulario() {
    const formularioContainer = document.getElementById('formulario-container');
    const form = document.getElementById('paciente-form');
    
    // Anima el cierre
    formularioContainer.style.maxHeight = '0';
    formularioContainer.style.opacity = '0';
    formularioContainer.style.marginBottom = '0';
    
    // Resetea después de la animación
    setTimeout(() => {
        form.reset();
        limpiarErrores();
        pacienteEditando = null;
    }, 300);
}

// Limpia los mensajes de error del formulario
function limpiarErrores() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.classList.add('hidden'));
}

// Guarda el nuevo paciente (POST) o actualiza uno existente (PUT)
async function guardarPaciente() {
    const accessToken = getAccessToken();
    const pacienteId = document.getElementById('paciente-id').value;

    // 1. Obtener datos del formulario
    const tutorId = document.getElementById('paciente-tutor').value;
    const nombre = document.getElementById('paciente-nombre').value.trim();
    const especie = document.getElementById('paciente-especie').value;
    const raza = document.getElementById('paciente-raza').value.trim();
    const genero = document.getElementById('paciente-genero').value;
    const fechaNacimiento = document.getElementById('paciente-fecha-nacimiento').value;
    // const color = document.getElementById('paciente-color').value.trim(); // Campo removido temporalmente

    // 2. Validación básica
    if (!tutorId || !nombre || !especie || !genero || !fechaNacimiento) {
        mostrarError('Por favor completa todos los campos obligatorios (*)');
        return;
    }

    // 3. Referencias a botones y alertas
    const errorAlert = document.getElementById('form-alert-error');
    const btnTexto = document.getElementById('btn-guardar-texto');
    const btnSpinner = document.getElementById('btn-guardar-spinner');

    // 4. Mostrar Spinner
    errorAlert.classList.add('hidden');
    btnTexto.classList.add('hidden');
    btnSpinner.classList.remove('hidden');

    try {
        // 5. Crear el objeto de datos
        const data = {
            tutor: tutorId,
            nombre: nombre,
            especie: especie,
            raza: raza || '',
            fecha_nacimiento: fechaNacimiento,
            genero: genero
        };

        // Agregar color si existe (deshabilitado - campo no existe en DB)
        // if (color) {
        //     data.color = color;
        // }

        // 6. Determinar método y URL
        const metodo = pacienteId ? 'PUT' : 'POST';
        const url = pacienteId ? `/api/pacientes/${pacienteId}/` : '/api/pacientes/';

        // 7. Enviar a la API
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
            console.error('Status:', response.status);
            console.error('Datos enviados:', data);
            
            // Mostrar error más descriptivo
            let mensajeError = 'Error al guardar. ';
            if (errorData.detail) {
                mensajeError += errorData.detail;
            } else if (errorData.non_field_errors) {
                mensajeError += errorData.non_field_errors.join(', ');
            } else {
                // Mostrar errores de campos específicos
                const errores = Object.entries(errorData).map(([campo, msgs]) => {
                    return `${campo}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
                });
                mensajeError += errores.join('; ');
            }
            
            throw new Error(mensajeError);
        }

        const pacienteGuardado = await response.json();

        // 8. Éxito: Mostrar notificación y cerrar formulario
        Swal.fire({
            title: pacienteId ? '¡Actualizado!' : '¡Guardado!',
            text: `El paciente ${nombre} ha sido ${pacienteId ? 'actualizado' : 'registrado'} correctamente.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            backdrop: 'rgba(0, 0, 0, 0.7)'
        });

        cerrarFormulario();
        cargarPacientes(); // Recargar toda la tabla

    } catch (error) {
        // 9. Error: Mostrar alerta con el mensaje específico
        console.error('Error completo:', error);
        mostrarError(error.message || 'Error al guardar. Verifica los datos e intenta nuevamente.');
    } finally {
        // 10. Ocultar Spinner
        btnTexto.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
    }
}

// Muestra un mensaje de error en el formulario
function mostrarError(mensaje) {
    const errorAlert = document.getElementById('form-alert-error');
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = mensaje;
    errorAlert.classList.remove('hidden');
    
    // Scroll al error
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        
        // Color field removed - not in database model
        // if (paciente.color) {
        //     document.getElementById('paciente-color').value = paciente.color;
        // }

    } catch (error) {
        console.error('Error cargando paciente:', error);
        mostrarError('Error al cargar los datos del paciente.');
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
    const resultado = await Swal.fire({
        title: '¿Eliminar paciente?',
        html: `
            <p class="text-white/80 mb-4">¿Estás seguro de eliminar a <strong>${nombrePaciente}</strong>?</p>
            <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-white/70">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Esta acción eliminará también todo su historial médico y citas asociadas.
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
        backdrop: 'rgba(0, 0, 0, 0.7)'
    });

    if (!resultado.isConfirmed) {
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

        if (!response.ok) {
            throw new Error('Error al eliminar paciente');
        }
        
        // Mostrar éxito
        Swal.fire({
            title: '¡Eliminado!',
            text: `${nombrePaciente} y todos sus registros han sido eliminados.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            backdrop: 'rgba(0, 0, 0, 0.7)'
        });

        // Recargar la tabla
        cargarPacientes();

    } catch (error) {
        console.error('Error eliminando paciente:', error);
        Swal.fire({
            title: 'Error al Eliminar',
            html: `
                <p class="text-white/80 mb-3">No se pudo eliminar el paciente.</p>
                <p class="text-sm text-white/60">Esto puede deberse a:</p>
                <ul class="text-left text-sm text-white/60 mt-2 space-y-1">
                    <li>• Problemas de conexión</li>
                    <li>• Restricciones de base de datos</li>
                    <li>• Permisos insuficientes</li>
                </ul>
            `,
            icon: 'error',
            confirmButtonText: 'Entendido',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            backdrop: 'rgba(0, 0, 0, 0.7)'
        });
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
                <button class="btn-editar px-3 py-1.5 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 transition" 
                        data-paciente-id="${paciente.id}"
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-eliminar px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 transition" 
                        data-paciente-id="${paciente.id}"
                        data-paciente-nombre="${paciente.nombre}"
                        title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Event listeners para los botones
    row.querySelector('.btn-editar').addEventListener('click', function() {
        const pacienteId = this.getAttribute('data-paciente-id');
        abrirFormulario(parseInt(pacienteId));
    });
    
    row.querySelector('.btn-eliminar').addEventListener('click', function() {
        const pacienteId = this.getAttribute('data-paciente-id');
        const nombrePaciente = this.getAttribute('data-paciente-nombre');
        eliminarPaciente(parseInt(pacienteId), nombrePaciente);
    });
    
    tableBody.appendChild(row);
}