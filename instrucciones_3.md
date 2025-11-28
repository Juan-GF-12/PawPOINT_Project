# Instrucciones para Cursor: Seguridad Estricta de Rutas y Separación de Roles

**Contexto Crítico:**
Debemos garantizar una separación total ("Muralla China") entre el entorno Veterinario (Dashboard) y el entorno Tutor (Portal).
Un Veterinario NO debe poder ver la vista simple del Portal (le falta funcionalidad).
Un Tutor JAMÁS debe poder entrar a una URL del Dashboard (riesgo de seguridad).

**Objetivo:**
Implementar decoradores y lógica de redirección forzada en el Backend y Frontend.

---

## Tarea 1: Backend - Decoradores de Acceso (Views.py)
**Archivo:** `core/views.py`

Crea o modifica las vistas `dashboard_view` y `portal_view` para validar el rol en el servidor antes de renderizar el HTML.

1.  **Crear Decoradores Personalizados (o lógica dentro de la vista):**
    * `tutor_required`: Si `request.user.profile.rol.nombre != 'Tutor'`, redirigir a `/dashboard/`.
    * `staff_required`: Si `request.user.profile.rol.nombre == 'Tutor'`, redirigir a `/portal/`.

2.  **Aplicar a las Vistas:**
    ```python
    @login_required
    def dashboard_view(request):
        if request.user.profile.rol.nombre == 'Tutor':
            return redirect('portal_view') # ¡Expulsado al portal!
        return render(request, 'core/dashboard.html')

    @login_required
    def portal_view(request):
        if request.user.profile.rol.nombre != 'Tutor':
            return redirect('dashboard_view') # ¡Expulsado al dashboard!
        return render(request, 'core/portal_tutor.html')
    ```

---

## Tarea 2: Frontend - Guardia de Navegación (JavaScript)
Aunque el backend proteja, el frontend debe evitar el "parpadeo" de carga.

**Archivo:** `core/static/core/js/auth.js` (y scripts globales)
1.  Verificar que la redirección del Login (`auth.js`) sea estricta.
2.  **Botón "Atrás" del Navegador:**
    * Si un usuario está en `/portal/` y le da "Atrás" (hacia el login), el sistema debe detectar que el token sigue vivo y devolverlo al `/portal/` inmediatamente.

---

## Tarea 3: Verificación de Fugas
Revisa los menús y botones:
1.  En `historial_medico.html`: El botón "Volver" **debe** tener lógica condicional.
    * Si es Tutor -> `href="/portal/"`
    * Si es Vet -> `href="/gestion-clinica/"` (o historial.back())
    * *Implementación:* Usar JS para setear el `href` correcto al cargar la página según el rol (`/api/me/`).

---

**Resultado Esperado:**
Es imposible para un usuario cruzar la frontera de su rol, ni escribiendo la URL manualmente ni usando los botones del navegador.