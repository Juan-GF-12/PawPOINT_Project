// Sistema de notificaciones globales
document.addEventListener('DOMContentLoaded', function() {
    const btnNotificaciones = document.getElementById('btn-notificaciones');
    const dropdownNotificaciones = document.getElementById('dropdown-notificaciones');
    const badgeNotificaciones = document.getElementById('badge-notificaciones');
    
    if (!btnNotificaciones || !dropdownNotificaciones) return;
    
    // Toggle dropdown
    btnNotificaciones.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownNotificaciones.classList.toggle('hidden');
        cargarNotificaciones();
    });
    
    // Cerrar al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!dropdownNotificaciones.contains(e.target) && e.target !== btnNotificaciones) {
            dropdownNotificaciones.classList.add('hidden');
        }
    });
    
    // Cargar notificaciones iniciales
    cargarNotificaciones();
    
    // Actualizar cada 30 segundos
    setInterval(cargarNotificaciones, 30000);
});

function cargarNotificaciones() {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    if (!token) return;
    
    fetch('/api/citas/', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(citas => {
        const ahora = new Date();
        const en24Horas = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
        
        // Filtrar citas próximas (próximas 24 horas)
        const citasProximas = citas.filter(cita => {
            const fechaCita = new Date(cita.fecha_hora);
            return fechaCita > ahora && fechaCita <= en24Horas && cita.estado === 'PENDIENTE';
        });
        
        const listaNotificaciones = document.getElementById('lista-notificaciones');
        const badge = document.getElementById('badge-notificaciones');
        
        if (!listaNotificaciones || !badge) return;
        
        if (citasProximas.length > 0) {
            badge.classList.remove('hidden');
            badge.textContent = citasProximas.length > 9 ? '9+' : citasProximas.length;
            
            listaNotificaciones.innerHTML = citasProximas.map(cita => {
                const fecha = new Date(cita.fecha_hora);
                const horaFormateada = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="p-4 hover:bg-white/5 transition cursor-pointer">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-calendar-alt text-yellow-400 text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-white text-sm font-semibold">${cita.paciente_nombre || 'Paciente'}</p>
                                <p class="text-white/70 text-xs">Cita pendiente - ${horaFormateada}</p>
                                <p class="text-white/50 text-xs mt-1">${cita.motivo || 'Sin motivo'}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            badge.classList.add('hidden');
            listaNotificaciones.innerHTML = `
                <div class="p-4 text-center text-white/60 text-sm">
                    <i class="fas fa-check-circle text-2xl mb-2 text-green-400 block"></i>
                    No hay notificaciones nuevas
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error cargando notificaciones:', error);
    });
}
