#!/usr/bin/env python
"""
Script para crear datos de prueba: paciente y cita
"""
import os
import django
import sys
from datetime import timedelta

# Configurar Django
sys.path.insert(0, 'E:\\PawPOINT\\pawpoint_project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pawpoint_project.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Tutor, Paciente, Cita, UserProfile, Rol
from django.utils import timezone

print("=== DATOS EXISTENTES ===\n")

print("TUTORES:")
for tutor in Tutor.objects.all():
    print(f"  ID: {tutor.id}, Nombre: {tutor.nombre}, Email: {tutor.email}")

print("\nPACIENTES:")
for paciente in Paciente.objects.all():
    print(f"  ID: {paciente.id}, Nombre: {paciente.nombre}, Tutor: {paciente.tutor.nombre}")

print("\nUSUARIOS:")
for user in User.objects.all():
    rol_name = "Sin rol"
    try:
        if user.profile and user.profile.rol:
            rol_name = user.profile.rol.nombre
    except:
        pass
    print(f"  ID: {user.id}, Username: {user.username}, Rol: {rol_name}")

print("\nCITAS:")
for cita in Cita.objects.all():
    print(f"  ID: {cita.id}, Paciente: {cita.paciente.nombre}, Vet: {cita.veterinario.username if cita.veterinario else 'N/A'}, Fecha: {cita.fecha_hora}")

print("\n=== CREAR DATOS DE PRUEBA ===\n")

# Obtener o crear un tutor
tutor = Tutor.objects.first()
if not tutor:
    print("Error: No hay tutores en la base de datos")
    sys.exit(1)

print(f"✓ Tutor seleccionado: {tutor.nombre} ({tutor.email})")

# Crear paciente si no existe
paciente = tutor.pacientes.first()
if not paciente:
    paciente = Paciente.objects.create(
        tutor=tutor,
        nombre="Max",
        especie="Perro",
        raza="Labrador",
        fecha_nacimiento="2020-05-15",
        genero="M"
    )
    print(f"✓ Paciente creado: {paciente.nombre}")
else:
    print(f"✓ Paciente encontrado: {paciente.nombre}")

# Obtener veterinario
vet = User.objects.filter(profile__rol__nombre='Veterinario').first()
if not vet:
    # Si no hay veterinario con rol, usar el primer usuario admin o staff
    vet = User.objects.filter(is_staff=True).first()
    if not vet:
        # Si no hay staff, usar cualquier usuario
        vet = User.objects.filter(username__in=['bios', 'admin']).first()
    if not vet:
        print("Error: No hay usuarios disponibles en la base de datos")
        sys.exit(1)

print(f"✓ Veterinario seleccionado: {vet.first_name} {vet.last_name}")

# Crear cita para mañana
manana = timezone.now() + timedelta(days=1)
manana = manana.replace(hour=14, minute=0, second=0, microsecond=0)

cita = Cita.objects.create(
    paciente=paciente,
    veterinario=vet,
    fecha_hora=manana,
    estado='CONFIRMADA',
    motivo='Revision general y vacunacion'
)

hora_str = manana.strftime('%H:%M')
fecha_str = manana.strftime('%Y-%m-%d')
print(f"✓ Cita creada para mañana {fecha_str} a las {hora_str}: ID {cita.id}")
