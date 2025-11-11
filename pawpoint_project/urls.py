# pawpoint_project/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core import views  # <-- CORREGIDO (antes era 'gestion')

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'tutores', views.TutorViewSet)
router.register(r'pacientes', views.PacienteViewSet)
router.register(r'citas', views.CitaViewSet)
router.register(r'fichas', views.FichaClinicaViewSet)
router.register(r'tratamientos', views.TratamientoViewSet)
router.register(r'roles', views.RolViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # URLs de la API
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # URLs DEL FRONTEND (corregidas a 'core')
    path('', views.index_view, name='index_view'),
    path('login/', views.login_view, name='login_view'),
    path('dashboard/', views.dashboard_view, name='dashboard_view'),
    path('pacientes/', views.pacientes_view, name='pacientes_view'),
]