# Instrucciones para Cursor: Refinamiento UI/UX Portal del Tutor (Estilo App Moderna)

**Objetivo:**
Transformar el `portal_tutor.html` en una experiencia "Mobile-App".
Debe sentirse moderno, fluido y animado, no como una página web estática antigua.

**Referencias Visuales:**
Estilo similar a apps de salud modernas (Alan, Oscar Health) o Fintech (Revolut).
Uso de espacios en blanco, tipografía sans-serif grande (Nunito/Poppins), sombras suaves y bordes redondeados (20px).

---

## Tarea 1: Estilos "App-Like" y Animaciones (CSS)
**Archivo:** `core/static/core/css/portal.css` (Crear nuevo y vincular en el template)

Implementa estas clases:
1.  **Contenedor Móvil:** Ancho máximo limitado en escritorio (para simular app) o full width en móvil.
2.  **Glassmorphism:** Tarjetas con fondo blanco translúcido y blur suave.
3.  **Animaciones de Entrada:**
    * `.fade-in-up`: Para que las tarjetas aparezcan subiendo suavemente al cargar.
    * `.slide-in-right`: Para cuando se entra al detalle de una mascota.
4.  **Botones Táctiles:** Altura mínima 48px (zona de toque segura).

---

## Tarea 2: Nueva Sección "Receta Digital" (Dashboard Tutor)
**Archivo:** `core/static/core/js/portal.js` y `portal_tutor.html`

El tutor necesita ver los medicamentos activos.
1.  **Lógica JS:**
    * Fetch a la última `FichaClinica` del paciente.
    * Si tiene contenido en el campo `tratamiento` o `receta`:
    * Renderizar una tarjeta destacada: **"💊 Medicación Actual"**.
    * Mostrar el texto de la receta formateado y limpio.

---

## Tarea 3: Navegación y Header
1.  **Header Pegajoso (Sticky):** Que se mantenga arriba al hacer scroll.
2.  **Saludo Personalizado:** "Hola, [Nombre]" con un icono de mano saludando 👋 animado.
3.  **Logout:** Un icono sutil de "Salir" en la esquina superior derecha, no un botón rojo agresivo.

---

## Tarea 4: Refinamiento de la Vista Historial (Modo Tutor)
Cuando el tutor entra al historial (`historial_medico.html`):
1.  **Navbar:** Ocultar la navbar principal del sistema. Mostrar una barra simple con botón "Atrás" (<) que ejecute `window.location.href = '/portal/'`.
2.  **Estética:** Asegúrate de que las tarjetas del timeline usen las mismas sombras y bordes redondeados que el portal.