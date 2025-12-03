# core/models.py
from django.db import models
from django.contrib.auth.models import User

# --- Modelos de Autenticación y Roles ---

class Rol(models.Model):
    """ Almacena los roles del sistema (Admin, Veterinario, Asistente) """
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre

class UserProfile(models.Model):
    """ Extiende el modelo User de Django con rol y teléfono """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    telefono = models.CharField(max_length=15, blank=True, null=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.rol.nombre if self.rol else 'Sin Rol'})"

# --- Modelos Centrales del Negocio (Tu Esquema) ---

class Tutor(models.Model):
    """ Dueño o responsable de los pacientes """
    rut = models.CharField(max_length=12, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    telefono = models.CharField(max_length=15)
    email = models.EmailField(max_length=150, unique=True)
    direccion = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.rut})"

class Paciente(models.Model):
    """ Las mascotas o pacientes """
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="pacientes")
    nombre = models.CharField(max_length=100)
    especie = models.CharField(max_length=50)
    raza = models.CharField(max_length=50, blank=True, null=True)
    fecha_nacimiento = models.DateField()
    genero = models.CharField(max_length=1, choices=[('M', 'Macho'), ('H', 'Hembra')])

    def __str__(self):
        return f"{self.nombre} ({self.especie}) - Tutor: {self.tutor.nombre}"

class Cita(models.Model):
    """ Agendamiento de citas """
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name="citas")
    veterinario = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="citas_agendadas"
    )
    fecha_hora = models.DateTimeField()
    estado = models.CharField(max_length=20, choices=[
        ('PENDIENTE', 'Pendiente'),
        ('CONFIRMADA', 'Confirmada'),
        ('CANCELADA', 'Cancelada'),
        ('COMPLETADA', 'Completada'),
    ], default='PENDIENTE')
    motivo = models.TextField(blank=True, null=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cita {self.id} - {self.paciente.nombre} ({self.fecha_hora})"

class FichaClinica(models.Model):
    """ Historial clínico por cada consulta """
    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE, related_name="fichas_clinicas")
    veterinario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="fichas_creadas"
    )
    fecha_consulta = models.DateTimeField(auto_now_add=True)
    motivo = models.CharField(max_length=255, blank=True, null=True)
    diagnostico = models.TextField()
    notas_medicas = models.TextField(blank=True, null=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperatura = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)

    def __str__(self):
        return f"Ficha {self.id} - {self.paciente.nombre} ({self.fecha_consulta.date()})"

class Tratamiento(models.Model):
    """ Tratamientos asociados a una ficha clínica """
    ficha_clinica = models.ForeignKey(FichaClinica, on_delete=models.CASCADE, related_name="tratamientos")
    descripcion = models.TextField()
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    medicamento = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Tratamiento {self.id} para Ficha {self.ficha_clinica.id}"
