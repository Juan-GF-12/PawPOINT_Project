# core/management/commands/poblar_db.py
"""Management Command para poblar la base de datos con datos de prueba.

Este script:
1. Limpia la base de datos
2. Crea roles
3. Crea usuarios (admin, vet1, vet2, tutor1, tutor2)
4. Crea mascotas
5. Crea citas (pasadas y futuras)
6. Crea fichas clínicas
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Rol, UserProfile, Tutor, Paciente, Cita, FichaClinica, Tratamiento
from django.utils import timezone
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Pobla la base de datos con datos de prueba'

    def handle(self, *args, **options):
        # Obtener hora actual para cálculos
        ahora = timezone.now()
        
        # Limpieza de datos existentes
        self.stdout.write(self.style.WARNING('Limpiando base de datos...'))
        User.objects.all().delete()
        Rol.objects.all().delete()
        Tutor.objects.all().delete()
        Paciente.objects.all().delete()
        Cita.objects.all().delete()
        FichaClinica.objects.all().delete()
        Tratamiento.objects.all().delete()

        # ====================================================================
        # PASO 1: CREAR ROLES
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('Creando roles...'))
        roles_nombres = ['Administrador', 'Veterinario', 'Asistente', 'Tutor']
        roles = {}
        for rol_nombre in roles_nombres:
            rol, created = Rol.objects.get_or_create(nombre=rol_nombre)
            roles[rol_nombre] = rol
            if created:
                self.stdout.write(f'  ✓ Rol creado: {rol_nombre}')

        # ====================================================================
        # PASO 2: CREAR USUARIO ADMIN
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('Creando usuario admin...'))
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@pawpoint.com',
            password='1234'
        )
        UserProfile.objects.create(user=admin_user, rol=roles['Administrador'])
        self.stdout.write(f'  ✓ Usuario: admin / Contraseña: 1234')

        # ====================================================================
        # PASO 3: CREAR USUARIOS VETERINARIOS
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('Creando veterinarios...'))
        vets = []
        for i, vet_username in enumerate(['vet1', 'vet2'], 1):
            vet_user = User.objects.create_user(
                username=vet_username,
                email=f'{vet_username}@pawpoint.com',
                password='1234',
                first_name=f'Dr. Veterinario',
                last_name=f'{i}'
            )
            vet_user.is_staff = True
            vet_user.save()
            UserProfile.objects.create(user=vet_user, rol=roles['Veterinario'])
            vets.append(vet_user)
            self.stdout.write(f'  ✓ Usuario: {vet_username} / Contraseña: 1234')

        # ====================================================================
        # PASO 4: CREAR USUARIOS TUTORES
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('Creando tutores...'))
        tutores_data = [
            {'username': 'tutor1', 'email': 'juan@example.com', 'nombre': 'Juan', 'apellido': 'Pérez', 'rut': '12345678-9', 'telefono': '912345678'},
            {'username': 'tutor2', 'email': 'maria@example.com', 'nombre': 'Maria', 'apellido': 'Soto', 'rut': '87654321-0', 'telefono': '987654321'},
        ]
        tutores_users = []
        for tutor_data in tutores_data:
            tutor_user = User.objects.create_user(
                username=tutor_data['username'],
                email=tutor_data['email'],
                password='1234',
                first_name=tutor_data['nombre'],
                last_name=tutor_data['apellido']
            )
            UserProfile.objects.create(user=tutor_user, rol=roles['Tutor'])
            
            # Crear perfil de Tutor (sin relación a User, solo datos básicos)
            tutor = Tutor.objects.create(
                email=tutor_data['email'],
                nombre=tutor_data['nombre'],
                apellido=tutor_data['apellido'],
                rut=tutor_data['rut'],
                telefono=tutor_data['telefono']
            )
            tutores_users.append((tutor_user, tutor))
            self.stdout.write(f'  ✓ Usuario: {tutor_data["username"]} ({tutor_data["nombre"]}) / Contraseña: 1234')

        # ====================================================================
        # PASO 5: CREAR MASCOTAS (PACIENTES)
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('Creando mascotas...'))
        
        # Mascotas para tutor1
        tutor1 = tutores_users[0][1]
        mascotas_tutor1 = [
            {'nombre': 'Max', 'especie': 'Perro', 'raza': 'Labrador', 'anios': 5, 'genero': 'M'},
            {'nombre': 'Luna', 'especie': 'Gato', 'raza': 'Persa', 'anios': 3, 'genero': 'H'},
        ]
        for mascota_data in mascotas_tutor1:
            fecha_nac = ahora.date() - timedelta(days=365*mascota_data['anios'])
            Paciente.objects.create(
                tutor=tutor1,
                nombre=mascota_data['nombre'],
                especie=mascota_data['especie'],
                raza=mascota_data['raza'],
                fecha_nacimiento=fecha_nac,
                genero=mascota_data['genero']
            )
            self.stdout.write(f'  ✓ Mascota: {mascota_data["nombre"]} ({mascota_data["especie"]}) - Tutor: {tutor1.nombre}')

        # Mascotas para tutor2
        tutor2 = tutores_users[1][1]
        mascota_tutor2 = {'nombre': 'Mishi', 'especie': 'Gato', 'raza': 'Siamés', 'anios': 2, 'genero': 'H'}
        fecha_nac = ahora.date() - timedelta(days=365*mascota_tutor2['anios'])
        Paciente.objects.create(
            tutor=tutor2,
            nombre=mascota_tutor2['nombre'],
            especie=mascota_tutor2['especie'],
            raza=mascota_tutor2['raza'],
            fecha_nacimiento=fecha_nac,
            genero=mascota_tutor2['genero']
        )
        self.stdout.write(f'  ✓ Mascota: {mascota_tutor2["nombre"]} ({mascota_tutor2["especie"]}) - Tutor: {tutor2.nombre}')

        # ====================================================================
        # PASO 6: CREAR CITAS
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('Creando citas...'))
        pacientes = Paciente.objects.all()
        
        # Citas pasadas (historial)
        for i in range(2):
            fecha_pasada = ahora - timedelta(days=30-i*15)
            cita = Cita.objects.create(
                paciente=pacientes[i % pacientes.count()],
                veterinario=vets[i % len(vets)],
                fecha_hora=fecha_pasada,
                motivo='Consulta general de seguimiento',
                estado='COMPLETADA'
            )
            self.stdout.write(f'  ✓ Cita PASADA: {cita.paciente.nombre} con Dr. {cita.veterinario.first_name} - {cita.fecha_hora.strftime("%d/%m/%Y %H:%M")}')

        # Citas futuras (próximas)
        manana = ahora + timedelta(days=1)
        for i in range(2):
            fecha_futura = manana + timedelta(hours=9 + i*2)
            cita = Cita.objects.create(
                paciente=pacientes[i % pacientes.count()],
                veterinario=vets[i % len(vets)],
                fecha_hora=fecha_futura,
                motivo='Control de vacunación',
                estado='CONFIRMADA'
            )
            self.stdout.write(f'  ✓ Cita FUTURA: {cita.paciente.nombre} con Dr. {cita.veterinario.first_name} - {cita.fecha_hora.strftime("%d/%m/%Y %H:%M")}')

        # ====================================================================
        # PASO 7: CREAR FICHAS CLÍNICAS
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('Creando fichas clínicas...'))
        mascota_max = Paciente.objects.get(nombre='Max')
        ficha = FichaClinica.objects.create(
            paciente=mascota_max,
            veterinario=vets[0],
            diagnostico='Displasia de cadera leve',
            notas_medicas='Se recomienda fisioterapia',
            peso='32.50',
            temperatura='38.5'
        )
        
        # Crear tratamiento para la ficha
        Tratamiento.objects.create(
            ficha_clinica=ficha,
            descripcion='Sesiones semanales de terapia con láser para tratar la displasia de cadera',
            fecha_inicio=ahora.date(),
            fecha_fin=(ahora + timedelta(days=30)).date(),
            medicamento='Tramadol (analgésico)'
        )
        self.stdout.write(f'  ✓ Ficha clínica creada para {mascota_max.nombre}')
        self.stdout.write(f'    - Tratamiento: Terapia con laser')

        # ====================================================================
        # RESUMEN FINAL
        # ====================================================================
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✓ BASE DE DATOS POBLADA EXITOSAMENTE'))
        self.stdout.write(self.style.SUCCESS('='*60))
        
        self.stdout.write(self.style.WARNING('\n📋 CREDENCIALES DE ACCESO:\n'))
        self.stdout.write('Admin:')
        self.stdout.write('  Usuario: admin')
        self.stdout.write('  Contraseña: 1234\n')
        
        self.stdout.write('Veterinarios:')
        for vet_username in ['vet1', 'vet2']:
            self.stdout.write(f'  Usuario: {vet_username}')
            self.stdout.write(f'  Contraseña: 1234')
        
        self.stdout.write('\nTutores:')
        for tutor_data in tutores_data:
            self.stdout.write(f'  Usuario: {tutor_data["username"]} ({tutor_data["nombre"]} {tutor_data["apellido"]})')
            self.stdout.write(f'  Contraseña: 1234')
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60 + '\n'))
