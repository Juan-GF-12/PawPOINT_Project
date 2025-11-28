# core/views.py
"""Vistas API REST y de renderización de templates.

Contiene ViewSets para la API REST con control de acceso basado en roles
y vistas para renderizar templates del frontend.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.decorators import api_view, permission_classes
from .models import Tutor, Paciente, Cita, FichaClinica, Tratamiento, Rol
from .serializers import (
    RegisterSerializer, TutorSerializer, PacienteSerializer, CitaSerializer, 
    FichaClinicaSerializer, TratamientoSerializer, RolSerializer, UserSerializer,
    CurrentUserSerializer, RegistroTutorSerializer,
)
from django.shortcuts import render, redirect
from django.db.models import Q
from datetime import datetime, timedelta
from functools import wraps

from rest_framework import generics, permissions, status
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response

# ============================================================================
# DECORADORES DE SEGURIDAD - CONTROL DE ACCESO BASADO EN ROLES
# ============================================================================

def staff_required(view_func):
    """Decorador que requiere que el usuario sea staff (Veterinario, Asistente, Administrador).
    
    Redirige a tutores al portal de tutores.
    Redirige usuarios no autenticados al login.
    
    Args:
        view_func: Función de vista a decorar
        
    Returns:
        Función decorada con validación de rol
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Verificar autenticación
        if not request.user.is_authenticated:
            return redirect('/login/')
        
        # Verificar rol
        try:
            rol_usuario = request.user.profile.rol.nombre
            if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']:
                return view_func(request, *args, **kwargs)
            else:
                # Usuario autenticado pero sin permisos (probablemente Tutor)
                return redirect('/portal/')
        except AttributeError:
            # Usuario sin perfil o sin rol asignado
            return redirect('/login/')
    
    return wrapper


def tutor_required(view_func):
    """Decorador que requiere que el usuario sea un tutor.
    
    Redirige a staff al dashboard principal.
    Redirige usuarios no autenticados al login.
    
    Args:
        view_func: Función de vista a decorar
        
    Returns:
        Función decorada con validación de rol
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Verificar autenticación
        if not request.user.is_authenticated:
            return redirect('/login/')
        
        # Verificar rol
        try:
            rol_usuario = request.user.profile.rol.nombre
            if rol_usuario == 'Tutor':
                return view_func(request, *args, **kwargs)
            else:
                # Usuario staff intentando acceder al portal de tutores
                return redirect('/dashboard/')
        except AttributeError:
            # Usuario sin perfil o sin rol asignado
            return redirect('/login/')
    
    return wrapper


# ============================================================================
# PERMISOS PERSONALIZADOS
# ============================================================================

class EsStaffOSoloLectura(BasePermission):
    """
    Permiso personalizado que permite:
    - GET/HEAD/OPTIONS para todos los usuarios autenticados
    - POST/PUT/PATCH/DELETE solo para staff (Veterinario, Asistente, Administrador)
    """
    def has_permission(self, request, view):
        # Permitir operaciones de solo lectura para todos
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        
        # Operaciones de escritura solo para staff
        try:
            rol_usuario = request.user.profile.rol.nombre
            return rol_usuario in ['Veterinario', 'Asistente', 'Administrador']
        except AttributeError:
            return False

# ============================================================================
# VIEWSETS API CON CONTROL DE ACCESO POR ROLES
# ============================================================================
# Cada ViewSet filtra los datos según el rol del usuario autenticado:
# - Veterinario/Asistente/Administrador: acceso total
# - Tutor: acceso solo a sus propios datos (solo lectura)

class TutorViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar tutores (dueños de mascotas).
    
    Permisos:
    - Staff: ve todos los tutores
    - Tutor: ve solo sus propios datos
    """
    queryset = Tutor.objects.all()
    serializer_class = TutorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra tutores según el rol del usuario autenticado."""
        user = self.request.user
        try:
            rol_usuario = user.profile.rol.nombre
        except AttributeError:
            return Tutor.objects.none()
        
        # Staff ve todos los tutores
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']:
            return Tutor.objects.all()
        
        # Tutor solo ve sus propios datos
        elif rol_usuario == 'Tutor':
            return Tutor.objects.filter(email=user.email)
        
        # Por defecto no devuelve nada
        return Tutor.objects.none()

class PacienteViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar pacientes (mascotas).
    
    Permisos:
    - Staff: acceso completo (CRUD)
    - Tutor: solo lectura de sus propias mascotas
    """
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated, EsStaffOSoloLectura]
    
    def get_queryset(self):
        """Filtra pacientes según el rol del usuario autenticado."""
        user = self.request.user
        try:
            rol_usuario = user.profile.rol.nombre
        except AttributeError:
            return Paciente.objects.none()
        
        # Staff ve todos los pacientes
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']:
            return Paciente.objects.all()
        
        # Tutor solo ve sus propias mascotas
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return Paciente.objects.filter(tutor=tutor)
            except Tutor.DoesNotExist:
                return Paciente.objects.none()
        
        return Paciente.objects.none()

class CitaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar citas veterinarias.
    
    Permisos:
    - Staff: acceso completo (CRUD)
    - Tutor: solo lectura de citas de sus mascotas
    
    Incluye validación automática contra solapamientos via CitaSerializer.validate()
    """
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated, EsStaffOSoloLectura]
    
    def get_queryset(self):
        """Filtra citas según el rol del usuario autenticado."""
        user = self.request.user
        try:
            rol_usuario = user.profile.rol.nombre
        except AttributeError:
            return Cita.objects.none()
        
        # Staff ve todas las citas
        if rol_usuario in ['Asistente', 'Administrador', 'Veterinario']:
            return Cita.objects.all()
        
        # Tutor solo ve citas de sus mascotas
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return Cita.objects.filter(paciente__tutor=tutor)
            except Tutor.DoesNotExist:
                return Cita.objects.none()
        
        return Cita.objects.none()

class FichaClinicaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar fichas clínicas.
    
    Permisos:
    - Staff: acceso completo (CRUD)
    - Tutor: solo lectura de fichas de sus mascotas
    
    El veterinario se asigna automáticamente desde el usuario autenticado.
    """
    queryset = FichaClinica.objects.all()
    serializer_class = FichaClinicaSerializer
    permission_classes = [IsAuthenticated, EsStaffOSoloLectura]
    
    def get_queryset(self):
        """Filtra fichas clínicas según el rol del usuario autenticado."""
        user = self.request.user
        try:
            rol_usuario = user.profile.rol.nombre
        except AttributeError:
            return FichaClinica.objects.none()
        
        # Staff ve todas las fichas
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']:
            return FichaClinica.objects.all()
        
        # Tutor solo ve fichas de sus mascotas
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return FichaClinica.objects.filter(paciente__tutor=tutor)
            except Tutor.DoesNotExist:
                return FichaClinica.objects.none()
        
        return FichaClinica.objects.none()
    
    def perform_create(self, serializer):
        """Asigna automáticamente el usuario autenticado como veterinario.
        
        Esto evita que el cliente deba enviar el veterinario en cada solicitud.
        """
        serializer.save(veterinario=self.request.user)

class TratamientoViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar tratamientos.
    
    Permisos:
    - Staff: acceso completo (CRUD)
    - Tutor: solo lectura de tratamientos de sus mascotas
    """
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
    permission_classes = [IsAuthenticated, EsStaffOSoloLectura]
    
    def get_queryset(self):
        """Filtra tratamientos según el rol del usuario autenticado."""
        user = self.request.user
        try:
            rol_usuario = user.profile.rol.nombre
        except AttributeError:
            return Tratamiento.objects.none()
        
        # Staff ve todos los tratamientos
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']:
            return Tratamiento.objects.all()
        
        # Tutor solo ve tratamientos de sus mascotas
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return Tratamiento.objects.filter(ficha_clinica__paciente__tutor=tutor)
            except Tutor.DoesNotExist:
                return Tratamiento.objects.none()
        
        return Tratamiento.objects.none()

class RolViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar roles del sistema."""
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]

class RegisterView(generics.CreateAPIView):
    """Vista para registrar nuevos tutores.
    
    Crea automáticamente:
    - Usuario de Django
    - Perfil con rol 'Tutor'
    - Registro en modelo Tutor
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegistroTutorSerializer

class VeterinarioListView(APIView):
    """Vista para listar todos los veterinarios registrados."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        veterinarios = User.objects.filter(
            profile__rol__nombre='Veterinario'
        )
        data = [{'id': v.id, 'nombre': f"{v.first_name} {v.last_name}"} for v in veterinarios]
        return Response(data)

class CurrentUserView(APIView):
    """Vista para obtener datos del usuario autenticado incluyendo su rol.
    
    Se utiliza en el endpoint /api/me/ después del login para determinar
    a dónde redireccionar al usuario (Dashboard para Vet, Portal para Tutor).
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retorna los datos del usuario actual con su rol."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class RegistroTutorView(APIView):
    """Vista para registrar nuevos tutores.
    
    Esta es una vista pública (sin autenticación requerida) que permite
    que nuevos tutores se registren en el sistema.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Crea un nuevo tutor con sus credenciales."""
        serializer = RegistroTutorSerializer(data=request.data)
        if serializer.is_valid():
            tutor = serializer.save()
            return Response({
                'success': True,
                'message': f'Tutor {tutor.nombre} registrado exitosamente',
                'tutor_id': tutor.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# ============================================================================
# VISTAS PARA RENDERIZAR TEMPLATES DEL FRONTEND
# ============================================================================

def index_view(request):
    """Renderiza la página de inicio con estadísticas."""
    from django.db.models import Count
    from datetime import datetime, timedelta
    
    # Obtener estadísticas generales
    total_pacientes = Paciente.objects.count()
    total_tutores = Tutor.objects.count()
    
    # Citas del mes actual
    now = datetime.now()
    inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    citas_mes = Cita.objects.filter(fecha_hora__gte=inicio_mes).count()
    
    # Pacientes por especie
    especies_data = Paciente.objects.values('especie').annotate(
        cantidad=Count('id')
    ).order_by('-cantidad')
    
    context = {
        'total_pacientes': total_pacientes,
        'total_tutores': total_tutores,
        'citas_mes': citas_mes,
        'especies_data': list(especies_data),
    }
    
    return render(request, 'core/index.html', context)

def login_view(request):
    """Renderiza la página de login."""
    return render(request, 'core/login.html')

def dashboard_view(request):
    """Renderiza el dashboard principal con estadísticas reales.
    
    Nota: La autenticación y control de acceso se maneja en el frontend mediante JWT.
    """
    from django.db.models import Count, Q
    from datetime import datetime, timedelta, date
    
    # Obtener fecha actual
    hoy = date.today()
    ahora = datetime.now()
    
    # KPI 1: Citas de hoy
    citas_hoy = Cita.objects.filter(
        fecha_hora__date=hoy
    ).count()
    
    # KPI 2: Total de pacientes activos
    total_pacientes = Paciente.objects.count()
    
    # KPI 3: Total de tutores
    total_tutores = Tutor.objects.count()
    
    # KPI 4: Citas pendientes de confirmación
    citas_pendientes = Cita.objects.filter(
        estado='PENDIENTE'
    ).count()
    
    # Próximas 5 citas (ordenadas por fecha más cercana)
    proximas_citas = Cita.objects.filter(
        fecha_hora__gte=ahora
    ).select_related('paciente', 'paciente__tutor', 'veterinario').order_by('fecha_hora')[:5]
    
    context = {
        'citas_hoy': citas_hoy,
        'total_pacientes': total_pacientes,
        'total_tutores': total_tutores,
        'citas_pendientes': citas_pendientes,
        'proximas_citas': proximas_citas,
    }
    
    return render(request, 'core/dashboard.html', context)

def pacientes_view(request):
    """Renderiza la página de gestión de pacientes.
    
    Nota: La autenticación y control de acceso se maneja en el frontend mediante JWT.
    """
    return render(request, 'core/pacientes.html')

def citas_view(request):
    """Renderiza la página de calendario de citas con FullCalendar.
    
    Nota: La autenticación y control de acceso se maneja en el frontend mediante JWT.
    """
    return render(request, 'core/citas.html')

def historial_view(request):
    """Renderiza la página de historial médico con timeline.
    
    ACCESO PÚBLICO (autenticado): Tanto tutores como staff pueden acceder.
    - Tutores: Solo lectura, sin controles de edición
    - Veterinarios/Asistentes/Administradores: Controles completos
    """
    # Obtener el rol del usuario actual
    user_rol = None
    if request.user.is_authenticated:
        try:
            user_rol = request.user.profile.rol.nombre
        except AttributeError:
            user_rol = None
    
    context = {
        'user_rol': user_rol,
        'es_tutor': user_rol == 'Tutor'
    }
    return render(request, 'core/historial_medico.html', context)

def gestion_clinica_view(request):
    """Renderiza la página de gestión clínica.
    
    Vista dedicada para veterinarios donde pueden buscar pacientes
    y acceder a sus historiales clínicos para realizar consultas.
    Nota: La autenticación y control de acceso se maneja en el frontend mediante JWT.
    """
    return render(request, 'core/gestion_clinica.html')

def register_view(request):
    """Renderiza la página de registro de nuevos usuarios."""
    return render(request, 'core/register.html')

def tutores_view(request):
    """Renderiza la página de gestión de tutores.
    
    Nota: La autenticación y control de acceso se maneja en el frontend mediante JWT.
    """
    return render(request, 'core/tutores.html')

def portal_view(request):
    """Renderiza el portal exclusivo para tutores.
    
    Este portal permite a los tutores visualizar sus mascotas y próximas citas.
    Nota: La autenticación y control de acceso se maneja en el frontend mediante JWT.
    """
    return render(request, 'core/portal_tutor.html')

def registro_tutor_view(request):
    """Renderiza la página de registro para nuevos tutores."""
    return render(request, 'core/registro.html')

# ============================================================================
# API ENDPOINTS PERSONALIZADOS
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_recordatorios(request):
    """Envía recordatorios por email a tutores con citas próximas.
    
    Busca citas que ocurrirán en las próximas 24-48 horas y envía
    un email recordatorio al tutor de cada paciente.
    
    Solo accesible para usuarios staff (Veterinario, Asistente, Administrador).
    
    Returns:
        JSON con el número de recordatorios enviados
    """
    # Verificar que el usuario sea staff
    try:
        rol_usuario = request.user.profile.rol.nombre
        if rol_usuario not in ['Veterinario', 'Asistente', 'Administrador']:
            return Response(
                {'error': 'No tienes permisos para enviar recordatorios'},
                status=status.HTTP_403_FORBIDDEN
            )
    except AttributeError:
        return Response(
            {'error': 'Usuario sin rol asignado'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Obtener citas próximas (24-48 horas)
    ahora = datetime.now()
    inicio_ventana = ahora + timedelta(hours=24)
    fin_ventana = ahora + timedelta(hours=48)
    
    citas_proximas = Cita.objects.filter(
        fecha_hora__gte=inicio_ventana,
        fecha_hora__lte=fin_ventana,
        estado='PENDIENTE'
    ).select_related('paciente', 'paciente__tutor', 'veterinario')
    
    # Enviar emails (simulado - en producción usar Django email backend)
    recordatorios_enviados = 0
    tutores_notificados = set()
    
    for cita in citas_proximas:
        tutor_email = cita.paciente.tutor.email
        
        # Evitar enviar múltiples emails al mismo tutor
        if tutor_email not in tutores_notificados:
            # Aquí iría la lógica de envío de email
            # from django.core.mail import send_mail
            # send_mail(
            #     subject=f'Recordatorio: Cita para {cita.paciente.nombre}',
            #     message=f'Su mascota {cita.paciente.nombre} tiene cita el {cita.fecha_hora}',
            #     from_email='noreply@pawpoint.cl',
            #     recipient_list=[tutor_email],
            # )
            
            tutores_notificados.add(tutor_email)
            recordatorios_enviados += 1
    
    return Response({
        'message': f'{recordatorios_enviados} recordatorio(s) enviado(s) exitosamente',
        'count': recordatorios_enviados,
        'citas_encontradas': citas_proximas.count()
    }, status=status.HTTP_200_OK)



