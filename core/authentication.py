# core/authentication.py
"""Backend de autenticación personalizado que permite login con email."""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class EmailBackend(ModelBackend):
    """
    Backend de autenticación que permite a los usuarios iniciar sesión
    usando su email en lugar de username.
    
    Intenta autenticar primero con username (comportamiento por defecto),
    y si falla, intenta con email.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # Intentar primero con username por defecto
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # Si no existe, intentar con email
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                return None
        
        # Verificar contraseña
        if user.check_password(password):
            return user
        
        return None
