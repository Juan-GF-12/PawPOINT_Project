/**
 * HISTORIAL MÉDICO - PAWPOINT (Versión Robusta / Multi-Campo)
 * Soluciona:
 * 1. Medicamentos que no aparecen (revisa múltiples nombres de variables).
 * 2. Motivo "No especificado" (revisa múltiples campos).
 * 3. Estilos de tratamientos (alto contraste).
 */

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let pacienteId = null;
let usuarioRol = null;

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    pacienteId = urlParams.get('paciente_id');
    
    if (!pacienteId) {
        // Redirección de seguridad si no hay ID
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'Tutor') window.location.href = '/portal/';
        else window.location.href = '/pacientes/';
        return;
    }
    
    await inicializarVista();
    renderNavigationControls();
    cargarPerfilPaciente();
    cargarTimelineFichas();
});

// ============================================================================
// NAVEGACIÓN Y ROLES
// ============================================================================

function renderNavigationControls() {
    const container = document.getElementById('navigation-controls');
    const userRole = localStorage.getItem('userRole');
    if (!container) return;
    
    const btnClass = "inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition";
    
    if (userRole === 'Tutor') {
        container.innerHTML = `<a href="/portal/" class="${btnClass}"><i class="fas fa-arrow-left"></i> <span>Volver a mis Mascotas</span></a>`;
    } else {
        container.innerHTML = `<a href="/gestion-clinica/" class="${btnClass}"><i class="fas fa-arrow-left"></i> <span>Volver a Gestión Clínica</span></a>`;
    }
}

async function inicializarVista() {
    const token = localStorage.getItem('accessToken');
    if (!token) { window.location.href = '/login/'; return; }

    try {
        const response = await fetch('/api/me/', { headers: { 'Authorization': 'Bearer ' + token } });
        if (!response.ok) throw new Error('Auth Error');
        const user = await response.json();
        usuarioRol = user.rol;
        if (user.rol === 'Tutor') aplicarModoTutor();
    } catch (e) {
        console.error(e);
    }
}

function aplicarModoTutor() {
    const sidebar = document.getElementById('sidebar-wrapper');
    if (sidebar) sidebar.style.display = 'none';
    const mainContent = document.getElementById('main-content');
    if (mainContent) { mainContent.style.width = '100%'; mainContent.style.maxWidth = '100%'; }
}

function getHeaders() {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================

function cargarPerfilPaciente() {
    fetch(`/api/pacientes/${pacienteId}/`, { headers: getHeaders() })
    .then(r => r.json())
    .then(paciente => {
        setText('paciente-nombre', paciente.nombre);
        setText('paciente-especie', paciente.especie);
        setText('paciente-raza', paciente.raza || '-');
        setText('paciente-raza-detail', paciente.raza || '-');
        setText('paciente-tutor', paciente.tutor_nombre || `ID: ${paciente.tutor}`);
        
        // Edad
        const nac = new Date(paciente.fecha_nacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - nac.getFullYear();
        if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
        setText('paciente-edad', `${edad} años`);

        // Datos para impresión
        document.body.setAttribute('data-paciente-nombre', paciente.nombre);
        document.body.setAttribute('data-paciente-especie', paciente.especie);
    })
    .catch(console.error);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function cargarTimelineFichas() {
    fetch(`/api/fichas/?paciente=${pacienteId}`, { headers: getHeaders() })
    .then(r => r.json())
    .then(fichas => {
        const container = document.getElementById('timeline-container');
        fichas.sort((a, b) => new Date(b.fecha_consulta) - new Date(a.fecha_consulta));
        
        if (fichas.length === 0) {
            container.innerHTML = `<div class="glass-panel p-8 text-center text-white/60"><i class="fas fa-folder-open text-4xl mb-3 opacity-50"></i><p>No hay historial clínico.</p></div>`;
            return;
        }
        
        container.innerHTML = '';
        fichas.forEach(ficha => renderizarTarjetaFicha(ficha, container));
    })
    .catch(err => {
        console.error(err);
        document.getElementById('timeline-container').innerHTML = `<div class="p-4 bg-red-500/20 text-red-200 rounded-xl text-center">Error al cargar historial.</div>`;
    });
}

// Variable global para guardar los tratamientos temporalmente
window.historialTratamientos = {}; 

function renderizarTarjetaFicha(ficha, container) {
    const fecha = new Date(ficha.fecha_consulta).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Recuperación robusta de datos
    const textoMotivo = ficha.motivo || ficha.motivo_consulta || ficha.descripcion || 'Sin motivo especificado';
    const motivoLower = textoMotivo.toLowerCase();

    // Estilos de Badge
    let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    let icon = 'fas fa-stethoscope';
    let tipoTexto = 'Consulta';

    if (motivoLower.includes('vacuna')) { badgeColor = 'bg-green-500/20 text-green-300 border-green-500/30'; icon = 'fas fa-syringe'; tipoTexto = 'Vacunación'; }
    else if (motivoLower.includes('cirugía')) { badgeColor = 'bg-red-500/20 text-red-300 border-red-500/30'; icon = 'fas fa-procedures'; tipoTexto = 'Cirugía'; }
    else if (motivoLower.includes('control')) { badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30'; icon = 'fas fa-clipboard-check'; tipoTexto = 'Control'; }

    // Procesar tratamientos
    const listaTratamientos = ficha.tratamientos || ficha.tratamiento_set || [];
    let htmlTratamientos = '';
    
    if (listaTratamientos && listaTratamientos.length > 0) {
        // Guardamos los tratamientos en la memoria global usando el ID de la ficha
        window.historialTratamientos[ficha.id] = listaTratamientos;

        const items = listaTratamientos.map(t => {
            const nombreMed = t.medicamento || t.nombre_medicamento || 'Medicamento';
            const descMed = t.descripcion || t.indicaciones || '';
            
            return `
            <div class="flex items-start gap-3 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20 shadow-sm">
                <div class="mt-1 min-w-[20px]"><i class="fas fa-pills text-yellow-400"></i></div>
                <div>
                    <strong class="text-yellow-100 block text-sm font-bold">${nombreMed}</strong>
                    <span class="text-yellow-50/80 text-xs block mt-0.5">${descMed}</span>
                </div>
            </div>`;
        }).join('');
        
        // Aquí agregamos el BOTÓN DE RE-IMPRIMIR
        htmlTratamientos = `
            <div class="mt-4 pt-4 border-t border-white/10">
                <div class="flex justify-between items-end mb-3">
                    <h4 class="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                        <i class="fas fa-prescription text-yellow-500"></i> Receta Médica
                    </h4>
                    <button onclick="reimprimirReceta(${ficha.id})" class="text-xs flex items-center gap-1 text-blue-300 hover:text-blue-200 transition bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                        <i class="fas fa-print"></i> Imprimir Copia
                    </button>
                </div>
                <div class="grid grid-cols-1 gap-2">
                    ${items}
                </div>
            </div>`;
    }

    const item = document.createElement('div');
    item.className = 'relative pl-8 pb-8 border-l-2 border-white/10 ml-4 last:pb-0 timeline-item';
    
    item.innerHTML = `
        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
        
        <div class="glass-panel p-6 rounded-2xl hover:bg-white/10 transition duration-300 border border-white/5 shadow-lg group">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-bold text-white group-hover:text-blue-200 transition">${fecha}</h3>
                    <p class="text-white/50 text-sm"><i class="fas fa-user-md mr-1"></i> ${ficha.veterinario_nombre || 'Veterinario'}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeColor} flex items-center gap-2">
                    <i class="${icon}"></i> ${tipoTexto}
                </span>
            </div>

            <div class="mb-4 p-3 rounded-lg bg-blue-500/10 border-l-4 border-blue-500">
                <strong class="text-blue-400 block text-xs uppercase tracking-wider mb-1">Motivo</strong>
                <p class="text-white font-medium">${textoMotivo}</p>
            </div>

            <div class="mb-4">
                <strong class="text-green-400 block text-xs uppercase tracking-wider mb-1">Diagnóstico</strong>
                <p class="text-white/80 leading-relaxed text-sm">${ficha.diagnostico || 'Sin diagnóstico detallado.'}</p>
            </div>

            <div class="flex flex-wrap gap-3 mb-2">
                ${ficha.peso ? `<div class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/90 font-medium"><i class="fas fa-weight text-orange-400 mr-2"></i>${ficha.peso} kg</div>` : ''}
                ${ficha.temperatura ? `<div class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/90 font-medium"><i class="fas fa-thermometer-half text-red-400 mr-2"></i>${ficha.temperatura} °C</div>` : ''}
            </div>

            ${ficha.notas_medicas ? `<div class="mt-4 text-sm text-white/60 italic border-t border-white/10 pt-2"><i class="fas fa-sticky-note mr-1"></i> "${ficha.notas_medicas}"</div>` : ''}

            ${htmlTratamientos}
        </div>
    `;

    container.appendChild(item);
}

// Función auxiliar para el botón
function reimprimirReceta(idFicha) {
    const tratamientos = window.historialTratamientos[idFicha];
    if (tratamientos) {
        imprimirReceta(tratamientos);
    } else {
        Swal.fire('Error', 'No se encontraron datos de la receta', 'error');
    }
}

// ============================================================================
// GESTIÓN DEL MODAL
// ============================================================================

function toggleModal(show) {
    const modal = document.getElementById('modalFicha');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function abrirModalFicha() {
    toggleModal(true);
    document.getElementById('formFicha').reset();
    document.getElementById('ficha-error').classList.add('hidden');
    const container = document.getElementById('medicamentos-container');
    container.innerHTML = '';
    agregarMedicamento();
}

function agregarMedicamento() {
    const container = document.getElementById('medicamentos-container');
    const div = document.createElement('div');
    div.className = 'medicamento-row grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b border-white/5 last:border-0 animation-fade-in';
    
    div.innerHTML = `
        <div class="md:col-span-3">
            <input type="text" class="w-full px-3 py-2 text-sm rounded-lg glass-input placeholder-white/30" placeholder="Medicamento" name="med_nombre[]">
        </div>
        <div class="md:col-span-2">
            <input type="number" step="0.01" class="w-full px-3 py-2 text-sm rounded-lg glass-input placeholder-white/30" placeholder="Cant." name="med_cantidad[]">
        </div>
        <div class="md:col-span-2">
            <select class="w-full px-3 py-2 text-sm rounded-lg glass-input" name="med_unidad[]">
                <option value="mg">mg</option><option value="ml">ml</option><option value="ui">ui</option><option value="comprimidos">comp.</option><option value="gotas">gotas</option>
            </select>
        </div>
        <div class="md:col-span-3">
            <select class="w-full px-3 py-2 text-sm rounded-lg glass-input" name="med_frecuencia[]">
                <option value="c/24h">c/24h</option><option value="c/12h">c/12h</option><option value="c/8h">c/8h</option><option value="c/6h">c/6h</option><option value="unica">Única vez</option>
            </select>
        </div>
        <div class="md:col-span-2 flex gap-2">
            <input type="number" class="w-full px-3 py-2 text-sm rounded-lg glass-input placeholder-white/30" placeholder="Días" name="med_duracion[]">
            <button type="button" onclick="eliminarFila(this)" class="px-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    container.appendChild(div);
}

function eliminarFila(btn) {
    const row = btn.closest('.medicamento-row');
    const container = document.getElementById('medicamentos-container');
    if (container.children.length > 1) row.remove();
    else row.querySelectorAll('input').forEach(i => i.value = '');
}

// ============================================================================
// GUARDADO (ENVIANDO MÚLTIPLES NOMBRES DE CAMPOS POR SI ACASO)
// ============================================================================

function validarDatosClinicos() {
    const motivo = document.getElementById('ficha-motivo').value.trim();
    const diagnostico = document.getElementById('ficha-diagnostico').value.trim();
    
    if (!motivo) { Swal.fire({ title: 'Falta Motivo', text: 'El motivo es obligatorio.', icon: 'warning' }); return false; }
    if (!diagnostico) { Swal.fire({ title: 'Falta Diagnóstico', text: 'El diagnóstico es obligatorio.', icon: 'warning' }); return false; }
    return true;
}

function guardarFicha() {
    if (!validarDatosClinicos()) return;
    
    const motivoTexto = document.getElementById('ficha-motivo').value;

    // TRUCO: Enviamos el motivo con varios nombres comunes para asegurar que el backend lo atrape
    const fichaData = {
        paciente: pacienteId,
        motivo: motivoTexto,           // Nombre estándar
        motivo_consulta: motivoTexto,  // Nombre común en Django
        descripcion: motivoTexto,      // Por si acaso
        diagnostico: document.getElementById('ficha-diagnostico').value,
        notas_medicas: document.getElementById('ficha-notas').value,
        peso: document.getElementById('ficha-peso').value || null,
        temperatura: document.getElementById('ficha-temperatura').value || null
    };

    const btnGuardar = document.querySelector('button[onclick="guardarFicha()"]');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    fetch('/api/fichas/', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(fichaData)
    })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(fichaCreada => {
        guardarTratamientos(fichaCreada.id, btnGuardar, originalText);
    })
    .catch(err => {
        console.error(err);
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = originalText;
        document.getElementById('ficha-error').textContent = 'Error al guardar. Intente nuevamente.';
        document.getElementById('ficha-error').classList.remove('hidden');
    });
}

function guardarTratamientos(fichaId, btnGuardar, originalText) {
    const nombres = document.getElementsByName('med_nombre[]');
    const cantidades = document.getElementsByName('med_cantidad[]');
    const unidades = document.getElementsByName('med_unidad[]');
    const frecuencias = document.getElementsByName('med_frecuencia[]');
    const duraciones = document.getElementsByName('med_duracion[]');
    
    const tratamientos = [];
    
    for (let i = 0; i < nombres.length; i++) {
        if (nombres[i].value.trim()) {
            // Creamos un objeto tratamiento que el backend pueda entender
            tratamientos.push({
                ficha_clinica: fichaId,
                
                // Campos para la API
                medicamento: nombres[i].value,
                nombre_medicamento: nombres[i].value, // Backup name
                
                descripcion: `${cantidades[i].value} ${unidades[i].value} ${frecuencias[i].value}`,
                indicaciones: `${cantidades[i].value} ${unidades[i].value} ${frecuencias[i].value}`, // Backup name
                
                fecha_inicio: new Date().toISOString().split('T')[0],
                fecha_fin: duraciones[i].value ? calcularFechaFin(parseInt(duraciones[i].value)) : null,
                
                // Datos crudos para impresión local (si se usa)
                nombre: nombres[i].value,
                cantidad: cantidades[i].value,
                unidad: unidades[i].value,
                frecuencia: frecuencias[i].value,
                duracion: duraciones[i].value
            });
        }
    }
    
    if (tratamientos.length === 0) {
        finalizarGuardado(btnGuardar, originalText, [], fichaId);
        return;
    }

    Promise.all(tratamientos.map(t => 
        fetch('/api/tratamientos/', {
            method: 'POST', headers: getHeaders(), body: JSON.stringify(t)
        })
    ))
    .then(() => finalizarGuardado(btnGuardar, originalText, tratamientos, fichaId))
    .catch(err => {
        console.error('Error tratamientos:', err);
        finalizarGuardado(btnGuardar, originalText, [], fichaId); 
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Ficha guardada, pero hubo error en algunos medicamentos.' });
    });
}

function finalizarGuardado(btn, text, medicamentos, fichaId) {
    btn.disabled = false;
    btn.innerHTML = text;
    toggleModal(false);
    cargarTimelineFichas();
    
    if (medicamentos.length > 0) {
        Swal.fire({
            title: '¡Guardado!',
            html: `Se registró la consulta con receta.<br>¿Deseas imprimirla?`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-print"></i> Imprimir',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#0061ff',
            background: '#1e293b', color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) imprimirReceta(medicamentos, fichaId);
        });
    } else {
        Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
    }
}

function calcularFechaFin(dias) {
    const f = new Date(); f.setDate(f.getDate() + dias); return f.toISOString().split('T')[0];
}

// ============================================================================
// IMPRESIÓN
// ============================================================================

function imprimirReceta(medicamentos) {
    const pacienteNombre = document.body.getAttribute('data-paciente-nombre') || 'Paciente';
    const pacienteEspecie = document.body.getAttribute('data-paciente-especie') || '';
    const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    const win = window.open('', '_blank', 'width=900,height=700');
    
    let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Receta Médica - ${pacienteNombre}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
                body { font-family: 'Poppins', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                .header { text-align: center; border-bottom: 4px solid #3b82f6; padding-bottom: 20px; margin-bottom: 40px; }
                .brand { color: #3b82f6; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }
                .subtitle { color: #64748b; margin: 0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
                .info-box { background: #f8fafc; padding: 20px; border-radius: 16px; border-left: 6px solid #3b82f6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .info-label { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; font-weight: 600; }
                .info-value { font-size: 20px; font-weight: 700; color: #1e293b; }
                .info-sub { font-size: 14px; color: #64748b; margin-top: 2px; }
                .rx-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; color: #3b82f6; }
                .rx-icon { font-size: 32px; font-weight: bold; }
                .rx-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
                .med-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 20px; page-break-inside: avoid; background: white; }
                .med-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
                .med-name { color: #3b82f6; font-size: 18px; font-weight: 700; }
                .med-index { background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
                .med-desc-full { font-size: 15px; color: #334155; font-weight: 500; }
                .med-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .detail-item strong { display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
                .detail-item span { font-size: 15px; color: #334155; font-weight: 500; }
                .footer { margin-top: 80px; text-align: center; }
                .firma-box { width: 300px; margin: 0 auto; text-align: center; }
                .firma-line { border-bottom: 2px solid #cbd5e1; margin-bottom: 15px; height: 60px; }
                .firma-text { font-weight: 700; color: #334155; margin: 0; }
                .firma-sub { font-size: 13px; color: #94a3b8; margin: 5px 0 0 0; }
                .legal { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; }
                @media print { body { -webkit-print-color-adjust: exact; padding: 0; } .med-card { box-shadow: none; border: 1px solid #ccc; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="brand">🐾 PawPOINT</h1>
                <p class="subtitle">Centro Veterinario Integral</p>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <span class="info-label">Paciente</span>
                    <div class="info-value">${pacienteNombre}</div>
                    <div class="info-sub">${pacienteEspecie}</div>
                </div>
                <div class="info-box">
                    <span class="info-label">Fecha de Emisión</span>
                    <div class="info-value">${fechaHoy}</div>
                    <div class="info-sub">Validez: 30 días</div>
                </div>
            </div>

            <div class="rx-header">
                <span class="rx-icon">℞</span>
                <h2 class="rx-title">Prescripción Médica</h2>
            </div>
    `;
    
    medicamentos.forEach((m, idx) => {
        // Lógica Inteligente: ¿Es dato nuevo (detallado) o historial (descripción completa)?
        const nombre = m.nombre || m.medicamento || 'Medicamento';
        let contenidoDetalle = '';

        if (m.cantidad && m.unidad) {
            // Es un dato NUEVO (tiene campos separados)
            contenidoDetalle = `
                <div class="med-details">
                    <div class="detail-item"><strong>Dosis</strong><span>${m.cantidad} ${m.unidad}</span></div>
                    <div class="detail-item"><strong>Frecuencia</strong><span>${m.frecuencia}</span></div>
                    <div class="detail-item"><strong>Duración</strong><span>${m.duracion ? m.duracion + ' días' : 'Continuo'}</span></div>
                </div>`;
        } else {
            // Es un dato del HISTORIAL (solo tiene descripción/indicaciones)
            const descripcion = m.descripcion || m.indicaciones || 'Ver indicaciones';
            contenidoDetalle = `<div class="med-desc-full"><strong>Indicaciones:</strong> ${descripcion}</div>`;
        }

        html += `
            <div class="med-card">
                <div class="med-header">
                    <span class="med-name">${nombre}</span>
                    <span class="med-index">${idx + 1}</span>
                </div>
                ${contenidoDetalle}
            </div>
        `;
    });
    
    html += `
            <div class="footer">
                <div class="firma-box">
                    <div class="firma-line"></div> 
                    <p class="firma-text">Firma del Médico Veterinario</p>
                    <p class="firma-sub">Registro Colegio Médico Veterinario</p>
                </div>
                <div class="legal">
                    Receta generada electrónicamente por el sistema PawPOINT. <br>
                    Este documento es válido para la dispensación de los medicamentos indicados.
                </div>
            </div>
            <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
    `;
    
    win.document.write(html);
    win.document.close();
}