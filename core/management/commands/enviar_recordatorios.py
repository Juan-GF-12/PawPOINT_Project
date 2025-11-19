"""
Módulo: Management Command - Enviar Recordatorios.

Este módulo proporciona un comando de Django para enviar recordatorios de citas
a través de email a los tutores de pacientes veterinarios. El comando detecta
todas las citas programadas para el día siguiente y envía notificaciones a los
tutores correspondientes.

Uso: python manage.py enviar_recordatorios

El comando:
- Calcula la fecha del próximo día usando timezone.now()
- Filtra citas con estado PENDIENTE o CONFIRMADA
- Envía emails con detalles de la cita (paciente, hora, veterinario, motivo)
- Imprime en consola el número de recordatorios enviados
"""

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from core.models import Cita


class Command(BaseCommand):
    """
    Comando Django para enviar recordatorios de citas veterinarias.
    
    El comando envía emails a los tutores 24 horas antes de las citas
    programadas. Solo envía recordatorios para citas con estado PENDIENTE
    o CONFIRMADA.
    """

    help = 'Envía recordatorios de citas a los tutores de pacientes veterinarios'

    def handle(self, *args, **options):
        """
        Método principal que ejecuta la lógica del comando.
        
        El método:
        1. Calcula la fecha de mañana usando timezone.now() + timedelta(days=1)
        2. Filtra todas las citas programadas para mañana con estado válido
        3. Itera sobre cada cita y envía un email al tutor del paciente
        4. Imprime en consola el número de recordatorios enviados
        
        Args:
            *args: Argumentos posicionales del comando
            **options: Opciones nombradas del comando
        """
        
        # Se calcula la fecha de mañana usando timezone-aware datetime
        manana = timezone.now() + timedelta(days=1)
        fecha_manana = manana.date()
        
        # Se filtran las citas programadas para mañana con estado PENDIENTE o CONFIRMADA
        citas = Cita.objects.filter(
            fecha_hora__date=fecha_manana,
            estado__in=['PENDIENTE', 'CONFIRMADA']
        )
        
        # Se itera sobre cada cita para enviar el recordatorio
        contador_enviados = 0
        
        for cita in citas:
            try:
                # Se extrae la información necesaria de la cita y sus relaciones
                nombre_tutor = cita.paciente.tutor.nombre
                email_tutor = cita.paciente.tutor.email
                nombre_paciente = cita.paciente.nombre
                hora_cita = cita.fecha_hora.strftime('%H:%M')
                nombre_veterinario = cita.veterinario.first_name or cita.veterinario.last_name
                motivo = cita.motivo
                
                # Se construye el mensaje del recordatorio con los datos de la cita
                asunto = 'Recordatorio de Cita - PawPoint'
                mensaje = (
                    f'Hola {nombre_tutor},\n\n'
                    f'Recordamos que {nombre_paciente} tiene cita mañana a las {hora_cita} '
                    f'con el Dr. {nombre_veterinario}.\n'
                    f'Motivo: {motivo}\n\n'
                    f'¡Nos vemos pronto!\n'
                    f'PawPoint'
                )
                
                # Se envía el email usando la configuración de EMAIL_BACKEND
                send_mail(
                    asunto,
                    mensaje,
                    'PawPoint <no-reply@pawpoint.cl>',
                    [email_tutor],
                    fail_silently=False,
                )
                
                # Se incrementa el contador de recordatorios enviados exitosamente
                contador_enviados += 1
                
                # Se imprime en consola el envío exitoso
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Recordatorio enviado a {email_tutor} para {nombre_paciente}'
                    )
                )
                
            except Exception as e:
                # Se capturan errores durante el envío de email y se imprimen
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Error al enviar recordatorio para cita {cita.id}: {str(e)}'
                    )
                )
        
        # Se imprime el resumen final en consola
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Proceso completado: {contador_enviados} recordatorio(s) enviado(s) exitosamente'
            )
        )
