# core/views.py
"""Vistas API REST y de renderización de templates.

Contiene ViewSets para la API REST con control de acceso basado en roles
y vistas para renderizar templates del frontend.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Tutor, Paciente, Cita, FichaClinica, Tratamiento, Rol
from .serializers import (
    RegisterSerializer, TutorSerializer, PacienteSerializer, CitaSerializer, 
    FichaClinicaSerializer, TratamientoSerializer, RolSerializer, UserSerializer,
)
from django.shortcuts import render
from django.db.models import Q

from .serializers import RegisterSerializer
from rest_framework import generics, permissions
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions

# ============================================================================
# VIEWSETS API CON CONTROL DE ACCESO POR ROLES
# ============================================================================
# Cada ViewSet filtra los datos según el rol del usuario autenticado:
# - Veterinario/Asistente/Administrador: acceso total
# - Tutor: acceso solo a sus propios datos

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
    - Staff: ve todos los pacientes
    - Tutor: ve solo sus propias mascotas
    """
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]
    
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
    - Staff: ve todas las citas
    - Tutor: ve solo citas de sus mascotas
    
    Incluye validación automática contra solapamientos via CitaSerializer.validate()
    """
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]
    
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
    - Staff: ve todas las fichas
    - Tutor: ve solo fichas de sus mascotas
    
    El veterinario se asigna automáticamente desde el usuario autenticado.
    """
    queryset = FichaClinica.objects.all()
    serializer_class = FichaClinicaSerializer
    permission_classes = [IsAuthenticated]
    
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
    - Staff: ve todos los tratamientos
    - Tutor: ve solo tratamientos de sus mascotas
    """
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
    permission_classes = [IsAuthenticated]
    
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
    """Vista para registrar nuevos usuarios."""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class VeterinarioListView(APIView):
    """Vista para listar todos los veterinarios registrados."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        veterinarios = User.objects.filter(
            profile__rol__nombre='Veterinario'
        )
        data = [{'id': v.id, 'nombre': f"{v.first_name} {v.last_name}"} for v in veterinarios]
        return Response(data)
    
# ============================================================================
# VISTAS PARA RENDERIZAR TEMPLATES DEL FRONTEND
# ============================================================================

def index_view(request):
    """Renderiza la página de inicio."""
    return render(request, 'core/index.html')

def login_view(request):
    """Renderiza la página de login."""
    return render(request, 'core/login.html')

def dashboard_view(request):
    """Renderiza el dashboard principal."""
    return render(request, 'core/dashboard.html')

def pacientes_view(request):
    """Renderiza la página de gestión de pacientes."""
    return render(request, 'core/pacientes.html')

def citas_view(request):
    """Renderiza la página de calendario de citas con FullCalendar."""
    return render(request, 'core/citas.html')

def historial_view(request):
    """Renderiza la página de historial médico con timeline."""
    return render(request, 'core/historial_medico.html')

def register_view(request):
    """Renderiza la página de registro de nuevos usuarios."""
    return render(request, 'core/register.html')

def tutores_view(request):
    """Renderiza la página de gestión de tutores."""
    return render(request, 'core/tutores.html')
