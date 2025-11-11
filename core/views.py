# core/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Tutor, Paciente, Cita, FichaClinica, Tratamiento, Rol
from .serializers import (
    TutorSerializer, PacienteSerializer, CitaSerializer, 
    FichaClinicaSerializer, TratamientoSerializer, RolSerializer
)
from django.shortcuts import render
from django.db.models import Q

# --- VISTAS API CON SEGURIDAD POR ROL ---

class TutorViewSet(viewsets.ModelViewSet):
    queryset = Tutor.objects.all()  # Base queryset para el router
    serializer_class = TutorSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        try: rol_usuario = user.profile.rol.nombre
        except AttributeError: return Tutor.objects.none()
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']: return Tutor.objects.all()
        elif rol_usuario == 'Tutor': return Tutor.objects.filter(email=user.email)
        return Tutor.objects.none()

class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()  # Base queryset para el router
    serializer_class = PacienteSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        try: rol_usuario = user.profile.rol.nombre
        except AttributeError: return Paciente.objects.none()
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']: return Paciente.objects.all()
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return Paciente.objects.filter(tutor=tutor)
            except Tutor.DoesNotExist: return Paciente.objects.none()
        return Paciente.objects.none()

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()  # Base queryset para el router
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        try: rol_usuario = user.profile.rol.nombre
        except AttributeError: return Cita.objects.none()
        if rol_usuario in ['Asistente', 'Administrador', 'Veterinario']: return Cita.objects.all()
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return Cita.objects.filter(paciente__tutor=tutor)
            except Tutor.DoesNotExist: return Cita.objects.none()
        return Cita.objects.none()

class FichaClinicaViewSet(viewsets.ModelViewSet):
    queryset = FichaClinica.objects.all()  # Base queryset para el router
    serializer_class = FichaClinicaSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        try: rol_usuario = user.profile.rol.nombre
        except AttributeError: return FichaClinica.objects.none()
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']: return FichaClinica.objects.all()
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return FichaClinica.objects.filter(paciente__tutor=tutor)
            except Tutor.DoesNotExist: return FichaClinica.objects.none()
        return FichaClinica.objects.none()

class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()  # Base queryset para el router
    serializer_class = TratamientoSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        try: rol_usuario = user.profile.rol.nombre
        except AttributeError: return Tratamiento.objects.none()
        if rol_usuario in ['Veterinario', 'Asistente', 'Administrador']: return Tratamiento.objects.all()
        elif rol_usuario == 'Tutor':
            try:
                tutor = Tutor.objects.get(email=user.email)
                return Tratamiento.objects.filter(ficha_clinica__paciente__tutor=tutor)
            except Tutor.DoesNotExist: return Tratamiento.objects.none()
        return Tratamiento.objects.none()

class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]

# --- VISTAS DEL FRONTEND (Rutas corregidas) ---

def index_view(request):
    return render(request, 'core/index.html')

def login_view(request):
    return render(request, 'core/login.html')

def dashboard_view(request):
    return render(request, 'core/dashboard.html')

def pacientes_view(request):
    return render(request, 'core/pacientes.html')