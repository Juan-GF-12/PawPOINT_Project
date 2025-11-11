# core/serializers.py
from rest_framework import serializers
from .models import Tutor, Paciente, Cita, FichaClinica, Tratamiento, Rol
from django.contrib.auth.models import User

# Serializador para el modelo User (para mostrar info del Veterinario)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

# Serializador para el modelo Rol
class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__' # Incluye todos los campos

# Serializador para el modelo Tutor
class TutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tutor
        fields = '__all__'

# Serializador para el modelo Paciente
class PacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paciente
        fields = '__all__'

# Serializador para el modelo Cita
class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = '__all__'

# Serializador para el modelo FichaClinica
class FichaClinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichaClinica
        fields = '__all__'

# Serializador para el modelo Tratamiento
class TratamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tratamiento
        fields = '__all__'