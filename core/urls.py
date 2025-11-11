from django.urls import path
from . import views

urlpatterns = [
    # URLs del frontend
    path('', views.index_view, name='index_view'),
    path('login/', views.login_view, name='login_view'),
    path('dashboard/', views.dashboard_view, name='dashboard_view'),
    path('pacientes/', views.pacientes_view, name='pacientes_view'),
]
