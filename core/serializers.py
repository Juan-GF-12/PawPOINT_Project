# core/serializers.py
"""Serializadores para la API REST del sistema veterinario.
Estos componentes transforman los modelos de Django a/desde JSON.
"""
from rest_framework import serializers
from .models import Tutor, Paciente, Cita, FichaClinica, Tratamiento, Rol
from django.contrib.auth.models import User

# ============================================================================
# SERIALIZADORES DE AUTENTICACIÓN Y ROLES
# ============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Serializa datos básicos del usuario incluyendo su rol.
    
    Usado para mostrar información del usuario con su rol incluido.
    """
    rol = serializers.CharField(source='profile.rol.nombre', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol']

class CurrentUserSerializer(serializers.ModelSerializer):
    """Serializa datos del usuario actual incluyendo su rol.
    
    Se utiliza en el endpoint /api/me/ para devolver información del usuario
    autenticado, incluyendo su rol, necesario para redireccionar según tipo.
    """
    rol = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol']
    
    def get_rol(self, obj):
        """Obtiene el nombre del rol del usuario si existe."""
        try:
            return obj.profile.rol.nombre if obj.profile.rol else None
        except:
            return None

class RolSerializer(serializers.ModelSerializer):
    """Serializa los roles disponibles en el sistema."""
    class Meta:
        model = Rol
        fields = '__all__'

# ============================================================================
# SERIALIZADORES DE MODELOS PRINCIPALES
# ============================================================================

class TutorSerializer(serializers.ModelSerializer):
    """Serializa los datos de tutores (dueños de mascotas)."""
    class Meta:
        model = Tutor
        fields = '__all__'

class PacienteSerializer(serializers.ModelSerializer):
    """Serializa los datos de pacientes (mascotas)."""
    class Meta:
        model = Paciente
        fields = '__all__'

class CitaSerializer(serializers.ModelSerializer):
    """Serializa citas con validación de solapamientos."""
    class Meta:
        model = Cita
        fields = '__all__'
    
    def validate(self, data):
        """Valida que no existan citas superpuestas.
        
        Se verifica que:
        1. El veterinario no tenga otra cita en el mismo horario
        2. El paciente no tenga otra cita en el mismo horario
        
        Si existen conflictos, se lanza una excepción de validación.
        """
        fecha_hora = data.get('fecha_hora')
        veterinario = data.get('veterinario')
        paciente = data.get('paciente')
        cita_id = self.instance.id if self.instance else None
        
        # Se verifica si el veterinario tiene otra cita en la misma hora
        if fecha_hora and veterinario:
            citas_veterinario = Cita.objects.filter(
                veterinario=veterinario,
                fecha_hora=fecha_hora
            ).exclude(id=cita_id)
            
            if citas_veterinario.exists():
                raise serializers.ValidationError(
                    f"El veterinario ya tiene una cita agendada para {fecha_hora}"
                )
        
        # Se verifica si el paciente tiene otra cita en la misma hora
        if fecha_hora and paciente:
            citas_paciente = Cita.objects.filter(
                paciente=paciente,
                fecha_hora=fecha_hora
            ).exclude(id=cita_id)
            
            if citas_paciente.exists():
                raise serializers.ValidationError(
                    f"El paciente ya tiene una cita agendada para {fecha_hora}"
                )
        
        return data

class FichaClinicaSerializer(serializers.ModelSerializer):
    """Serializa fichas clínicas con veterinario como campo de solo lectura.
    
    El veterinario se asigna automáticamente desde el usuario autenticado
    mediante el método perform_create del ViewSet.
    """
    class Meta:
        model = FichaClinica
        fields = '__all__'
        read_only_fields = ['veterinario']

class TratamientoSerializer(serializers.ModelSerializer):
    """Serializa tratamientos asociados a fichas clínicas."""
    class Meta:
        model = Tratamiento
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    """Serializador para registrar nuevos usuarios."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        """Crea un nuevo usuario con la contraseña hasheada."""
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class RegistroTutorSerializer(serializers.Serializer):
    """Serializador para registrar nuevos tutores.
    
    Crea automáticamente:
    1. Usuario de Django
    2. Perfil con rol 'Tutor'
    3. Registro en modelo Tutor
    """
    nombre = serializers.CharField(max_length=100)
    apellido = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    rut = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)
    
    def validate_email(self, value):
        """Valida que el email no exista en la base de datos."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return value
    
    def validate_rut(self, value):
        """Valida que el RUT no exista en la base de datos."""
        if Tutor.objects.filter(rut=value).exists():
            raise serializers.ValidationError("Este RUT ya está registrado.")
        return value
    
    def create(self, validated_data):
        """Crea usuario, perfil y tutor."""
        from core.models import UserProfile
        
        # Crear usuario Django
        nombre = validated_data['nombre']
        apellido = validated_data['apellido']
        email = validated_data['email']
        password = validated_data['password']
        rut = validated_data['rut']
        
        # Generar username a partir del email
        username = email.split('@')[0]
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{email.split('@')[0]}{counter}"
            counter += 1
        
        # Crear usuario
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=nombre,
            last_name=apellido
        )
        
        # Obtener o crear rol Tutor
        rol_tutor, _ = Rol.objects.get_or_create(nombre='Tutor')
        
        # Crear perfil con rol
        UserProfile.objects.create(user=user, rol=rol_tutor)
        
        # Crear registro Tutor (sin relación a User)
        tutor = Tutor.objects.create(
            email=email,
            nombre=nombre,
            apellido=apellido,
            rut=rut,
            telefono=''  # Campo vacío por ahora
        )
        
        return tutor
    
