# scripts/poblar_datos_demo.py
"""
Script para poblar la base de datos con datos ficticios realistas
para demostración de estadísticas y gráficas en la homepage.
"""

import os
import django
import sys
from datetime import datetime, timedelta
import random

# Configurar Django
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
project_dir = os.path.join(base_dir, 'pawpoint_project')
sys.path.insert(0, project_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pawpoint_project.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Rol, UserProfile, Tutor, Paciente, Cita, FichaClinica, Tratamiento

def limpiar_datos_demo():
    """Elimina solo los datos de demostración."""
    print("🧹 Limpiando datos de demostración anteriores...")
    
    # Eliminar datos de demo (no los usuarios staff)
    Cita.objects.filter(paciente__tutor__email__contains='demo').delete()
    FichaClinica.objects.filter(paciente__tutor__email__contains='demo').delete()
    Paciente.objects.filter(tutor__email__contains='demo').delete()
    Tutor.objects.filter(email__contains='demo').delete()
    
    # Eliminar usuarios demo
    User.objects.filter(email__contains='demo').delete()
    
    print("✅ Datos de demostración eliminados")

def crear_tutores_demo():
    """Crea tutores ficticios."""
    print("👥 Creando tutores de demostración...")
    
    rol_tutor, _ = Rol.objects.get_or_create(nombre='Tutor')
    
    tutores_data = [
        {'nombre': 'María', 'apellido': 'González', 'rut': '19876543-2', 'email': 'maria.demo@pawpoint.cl', 'telefono': '+56912345001'},
        {'nombre': 'Juan', 'apellido': 'Pérez', 'rut': '18765432-3', 'email': 'juan.demo@pawpoint.cl', 'telefono': '+56912345002'},
        {'nombre': 'Ana', 'apellido': 'Martínez', 'rut': '17654321-4', 'email': 'ana.demo@pawpoint.cl', 'telefono': '+56912345003'},
        {'nombre': 'Carlos', 'apellido': 'López', 'rut': '16543210-5', 'email': 'carlos.demo@pawpoint.cl', 'telefono': '+56912345004'},
        {'nombre': 'Laura', 'apellido': 'Fernández', 'rut': '15432109-6', 'email': 'laura.demo@pawpoint.cl', 'telefono': '+56912345005'},
        {'nombre': 'Diego', 'apellido': 'Silva', 'rut': '14321098-7', 'email': 'diego.demo@pawpoint.cl', 'telefono': '+56912345006'},
        {'nombre': 'Sofía', 'apellido': 'Rojas', 'rut': '13210987-8', 'email': 'sofia.demo@pawpoint.cl', 'telefono': '+56912345007'},
        {'nombre': 'Andrés', 'apellido': 'Muñoz', 'rut': '12109876-9', 'email': 'andres.demo@pawpoint.cl', 'telefono': '+56912345008'},
    ]
    
    tutores_creados = []
    for data in tutores_data:
        # Crear usuario
        user = User.objects.create_user(
            username=data['email'].split('@')[0],
            email=data['email'],
            password='demo123456',
            first_name=data['nombre'],
            last_name=data['apellido']
        )
        
        # Crear perfil
        UserProfile.objects.create(user=user, rol=rol_tutor)
        
        # Crear tutor
        tutor = Tutor.objects.create(
            nombre=data['nombre'],
            apellido=data['apellido'],
            rut=data['rut'],
            email=data['email'],
            telefono=data['telefono']
        )
        tutores_creados.append(tutor)
    
    print(f"✅ {len(tutores_creados)} tutores creados")
    return tutores_creados

def crear_pacientes_demo(tutores):
    """Crea pacientes ficticios (mascotas)."""
    print("🐾 Creando pacientes de demostración...")
    
    from datetime import date
    
    nombres_perros = ['Max', 'Luna', 'Rocky', 'Bella', 'Duke', 'Lola', 'Thor', 'Nina', 'Bruno', 'Coco']
    nombres_gatos = ['Michi', 'Pelusa', 'Garfield', 'Simba', 'Nala', 'Milo', 'Felix', 'Luna', 'Tiger', 'Sasha']
    nombres_aves = ['Piolín', 'Kiwi', 'Loro', 'Canario', 'Paco']
    nombres_otros = ['Conejo', 'Hamster', 'Tortuga', 'Huron']
    
    razas_perros = ['Labrador', 'Golden Retriever', 'Pastor Alemán', 'Bulldog Francés', 'Beagle', 'Poodle', 'Mestizo']
    razas_gatos = ['Persa', 'Siamés', 'Maine Coon', 'Mestizo', 'Angora', 'British Shorthair']
    
    pacientes_creados = []
    hoy = date.today()
    
    # Crear 25 perros
    for i in range(25):
        tutor = random.choice(tutores)
        edad_anos = random.randint(1, 15)
        fecha_nac = date(hoy.year - edad_anos, random.randint(1, 12), random.randint(1, 28))
        
        paciente = Paciente.objects.create(
            tutor=tutor,
            nombre=random.choice(nombres_perros),
            especie='Perro',
            raza=random.choice(razas_perros),
            fecha_nacimiento=fecha_nac,
            genero=random.choice(['M', 'H'])
        )
        pacientes_creados.append(paciente)
    
    # Crear 18 gatos
    for i in range(18):
        tutor = random.choice(tutores)
        edad_anos = random.randint(1, 18)
        fecha_nac = date(hoy.year - edad_anos, random.randint(1, 12), random.randint(1, 28))
        
        paciente = Paciente.objects.create(
            tutor=tutor,
            nombre=random.choice(nombres_gatos),
            especie='Gato',
            raza=random.choice(razas_gatos),
            fecha_nacimiento=fecha_nac,
            genero=random.choice(['M', 'H'])
        )
        pacientes_creados.append(paciente)
    
    # Crear 5 aves
    for i in range(5):
        tutor = random.choice(tutores)
        edad_anos = random.randint(1, 10)
        fecha_nac = date(hoy.year - edad_anos, random.randint(1, 12), random.randint(1, 28))
        
        paciente = Paciente.objects.create(
            tutor=tutor,
            nombre=random.choice(nombres_aves),
            especie='Ave',
            raza='Común',
            fecha_nacimiento=fecha_nac,
            genero=random.choice(['M', 'H'])
        )
        pacientes_creados.append(paciente)
    
    # Crear 4 otros
    for i in range(4):
        tutor = random.choice(tutores)
        nombre_animal = random.choice(nombres_otros)
        edad_anos = random.randint(1, 5)
        fecha_nac = date(hoy.year - edad_anos, random.randint(1, 12), random.randint(1, 28))
        
        paciente = Paciente.objects.create(
            tutor=tutor,
            nombre=nombre_animal,
            especie=nombre_animal,
            raza='Común',
            fecha_nacimiento=fecha_nac,
            genero=random.choice(['M', 'H'])
        )
        pacientes_creados.append(paciente)
    
    print(f"✅ {len(pacientes_creados)} pacientes creados")
    print(f"   - 25 Perros")
    print(f"   - 18 Gatos")
    print(f"   - 5 Aves")
    print(f"   - 4 Otros")
    return pacientes_creados

def crear_citas_demo(pacientes):
    """Crea citas ficticias."""
    print("📅 Creando citas de demostración...")
    
    # Obtener veterinarios (usuarios staff)
    try:
        veterinarios = User.objects.filter(profile__rol__nombre='Veterinario')
        if not veterinarios.exists():
            print("⚠️  No hay veterinarios en la base de datos. Creando uno de prueba...")
            rol_vet, _ = Rol.objects.get_or_create(nombre='Veterinario')
            vet_user = User.objects.create_user(
                username='drvet',
                email='veterinario@pawpoint.cl',
                password='vet123456',
                first_name='Dr. Veterinario',
                last_name='Demo'
            )
            UserProfile.objects.create(user=vet_user, rol=rol_vet)
            veterinarios = [vet_user]
    except Exception as e:
        print(f"⚠️  Error obteniendo veterinarios: {e}")
        return []
    
    citas_creadas = []
    motivos = [
        'Vacunación', 'Control de rutina', 'Consulta general', 
        'Desparasitación', 'Chequeo dental', 'Esterilización',
        'Emergencia', 'Seguimiento post-operatorio'
    ]
    
    # Crear citas del mes actual (30 citas)
    hoy = datetime.now()
    for i in range(30):
        dias_atras = random.randint(0, 30)
        hora = random.choice([9, 10, 11, 12, 15, 16, 17, 18])
        fecha_hora = hoy.replace(hour=hora, minute=0, second=0, microsecond=0) - timedelta(days=dias_atras)
        
        cita = Cita.objects.create(
            paciente=random.choice(pacientes),
            veterinario=random.choice(veterinarios),
            fecha_hora=fecha_hora,
            motivo=random.choice(motivos),
            estado=random.choice(['CONFIRMADA', 'COMPLETADA', 'CANCELADA'])
        )
        citas_creadas.append(cita)
    
    print(f"✅ {len(citas_creadas)} citas creadas para este mes")
    return citas_creadas

def main():
    print("=" * 60)
    print("🚀 POBLANDO BASE DE DATOS CON DATOS DE DEMOSTRACIÓN")
    print("=" * 60)
    print()
    
    # Limpiar datos demo anteriores
    limpiar_datos_demo()
    print()
    
    # Crear datos
    tutores = crear_tutores_demo()
    print()
    
    pacientes = crear_pacientes_demo(tutores)
    print()
    
    citas = crear_citas_demo(pacientes)
    print()
    
    print("=" * 60)
    print("✅ PROCESO COMPLETADO")
    print("=" * 60)
    print()
    print("📊 Resumen de datos creados:")
    print(f"   - {len(tutores)} Tutores")
    print(f"   - {len(pacientes)} Pacientes")
    print(f"   - {len(citas)} Citas")
    print()
    print("🌐 Visita http://127.0.0.1:8000/ para ver las estadísticas")
    print()

if __name__ == '__main__':
    main()
