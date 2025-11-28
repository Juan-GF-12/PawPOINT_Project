#!/usr/bin/env python
"""
Script para crear una cita de prueba para mañana
"""
import os
import django
import sys

# Añadir el directorio pawpoint_project al path
sys.path.insert(0, 'E:\\PawPOINT\\pawpoint_project')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pawpoint_project.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Tutor, Paciente, Cita
from django.utils import timezone
from datetime import timedelta

# Obtener un tutor existente
tutores = Tutor.objects.all()
if tutores:
    tutor = tutores.first()
    print(f'Tutor encontrado: {tutor.nombre} {tutor.apellido} - Email: {tutor.email}')
    
    # Obtener un paciente del tutor
    pacientes = tutor.pacientes.all()
    if pacientes:
        paciente = pacientes.first()
        print(f'Paciente encontrado: {paciente.nombre}')
        
        # Obtener un veterinario
        vets = User.objects.filter(profile__rol__nombre='Veterinario')
        if vets:
            vet = vets.first()
            print(f'Veterinario encontrado: {vet.first_name} {vet.last_name}')
            
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
            print(f'✓ Cita creada para manana a las {hora_str}: ID {cita.id}')
        else:
            print('No hay veterinarios registrados')
    else:
        print('El tutor no tiene pacientes')
else:
    print('No hay tutores registrados')
