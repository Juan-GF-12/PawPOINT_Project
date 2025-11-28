# gestion/admin.py
from django.contrib import admin
from .models import Rol, UserProfile, Tutor, Paciente, Cita, FichaClinica, Tratamiento

# Registrar todos los modelos para verlos en el admin
admin.site.register(Rol)
admin.site.register(UserProfile)
admin.site.register(Tutor)
admin.site.register(Paciente)
admin.site.register(Cita)
admin.site.register(FichaClinica)
admin.site.register(Tratamiento)