# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # --- VISTAS DEL FRONTEND (HTML) ---
    path('', views.index_view, name='index_view'),
    path('login/', views.login_view, name='login_view'),
    path('register/', views.register_view, name='register_view'),
    path('dashboard/', views.dashboard_view, name='dashboard_view'),
    path('pacientes/', views.pacientes_view, name='pacientes_view'),
    path('citas/', views.citas_view, name='citas_view'),
    path('historial/', views.historial_view, name='historial_view'),
    path('tutores/', views.tutores_view, name='tutores_view'),

    # --- ENDPOINTS DE API ADICIONALES ---
    path('api/register/', views.RegisterView.as_view(), name='api_register'),
    path('api/veterinarios/', views.VeterinarioListView.as_view(), name='veterinario_list'),
]