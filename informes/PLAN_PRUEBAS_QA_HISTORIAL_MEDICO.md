# 📋 PLAN DE PRUEBAS - HISTORIAL MÉDICO (GESTIÓN CLÍNICA)

**Proyecto:** PawPOINT - Sistema de Gestión Veterinaria  
**Módulo:** Historial Médico y Gestión Clínica  
**Fecha:** 28 de Noviembre, 2025  
**Versión:** 1.0  
**QA Lead:** Análisis Automatizado de Código  

---

## 🎯 OBJETIVO

Validar el flujo completo del módulo de Historial Médico, enfocándose en:

1. **Tabla de Receta Dinámica**: Agregar, eliminar filas y validación de campos
2. **Validaciones de Signos Vitales**: Peso, temperatura y rangos fisiológicos
3. **Flujo Visual**: Modal AJAX, timeline sin recarga, badges automáticos
4. **Control de Acceso**: Restricciones por rol (Veterinario vs Tutor)
5. **Error Handling**: Manejo de errores y validaciones del lado del cliente

---

## 📊 CASOS DE PRUEBA MANUALES

### **Sección 1: Validaciones de Signos Vitales**

| ID | Escenario | Pasos a Realizar | Resultado Esperado |
|----|-----------|------------------|-------------------|
| **TC-001** | **Validación: Peso Negativo** | 1. Login como Veterinario<br>2. Ir a Gestión Clínica → Historial de paciente<br>3. Click en "Nueva Consulta"<br>4. Llenar Motivo: "Control rutinario"<br>5. Llenar Diagnóstico: "Sano"<br>6. Llenar Peso: **-5**<br>7. Click en "Guardar Ficha" | ❌ **ERROR**: Aparece SweetAlert con título "Error en Peso" y mensaje "El peso debe ser mayor a 0 kg".<br>✅ El modal NO se cierra<br>✅ Los datos del formulario se mantienen |
| **TC-002** | **Validación: Peso Cero** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar Motivo y Diagnóstico<br>4. Llenar Peso: **0**<br>5. Click en "Guardar Ficha" | ❌ **ERROR**: Aparece SweetAlert "Error en Peso" con mensaje "El peso debe ser mayor a 0 kg".<br>✅ Modal permanece abierto |
| **TC-003** | **Validación: Temperatura Extrema Alta** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar Motivo: "Revisión"<br>4. Llenar Diagnóstico: "Observar"<br>5. Llenar Temperatura: **50**<br>6. Click en "Guardar Ficha" | ❌ **ERROR**: Aparece SweetAlert "Temperatura Anormal" con HTML:<br>- "Rango de temperatura fisiológicamente imposible."<br>- "Verifique los datos."<br>- "(Rango normal: 37.5-39.5°C)"<br>✅ Modal NO se cierra |
| **TC-004** | **Validación: Temperatura Extrema Baja** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar campos obligatorios<br>4. Llenar Temperatura: **30**<br>5. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert "Temperatura Anormal" (temperatura < 35 es inválida según código línea 606)<br>✅ Modal permanece abierto |
| **TC-005** | **Validación: Temperatura en Límite Inferior** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar Motivo y Diagnóstico<br>4. Llenar Temperatura: **35**<br>5. Click en "Guardar Ficha" | ✅ **ÉXITO**: Ficha se guarda correctamente (35°C está en el límite permitido)<br>✅ Modal se cierra<br>✅ Timeline se recarga con nueva tarjeta |
| **TC-006** | **Validación: Temperatura en Límite Superior** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar campos obligatorios<br>4. Llenar Temperatura: **43**<br>5. Click en "Guardar Ficha" | ✅ **ÉXITO**: Ficha se guarda (43°C es límite máximo permitido)<br>✅ Modal se cierra<br>✅ Timeline actualiza sin recarga completa de página |
| **TC-007** | **Validación: Campo Motivo Vacío** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Dejar Motivo **VACÍO**<br>4. Llenar Diagnóstico: "Prueba"<br>5. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert con título "Campo Obligatorio" y mensaje "El motivo de consulta es obligatorio."<br>✅ Modal permanece abierto |
| **TC-008** | **Validación: Campo Diagnóstico Vacío** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar Motivo: "Control"<br>4. Dejar Diagnóstico **VACÍO**<br>5. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert "Campo Obligatorio" con mensaje "El diagnóstico es obligatorio."<br>✅ Formulario no se envía |
| **TC-026** | **Validación: Peso Opcional Vacío** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar solo Motivo y Diagnóstico<br>4. Dejar Peso **VACÍO**<br>5. Dejar Temperatura **VACÍO**<br>6. Click en "Guardar Ficha" | ✅ **ÉXITO**: Ficha se guarda correctamente<br>✅ Código línea 676: `peso: ... \|\| null`<br>✅ Validación de peso solo se ejecuta `if (peso && peso <= 0)` (línea 593)<br>✅ Tarjeta en timeline NO muestra chips de vitales si están vacíos |
| **TC-038** | **Edge Case: Temperatura Decimal** | 1. Login como Veterinario<br>2. Crear ficha con Temperatura: **38.7**<br>3. Guardar y verificar tarjeta en timeline | ✅ **ÉXITO**: Temperatura se guarda y muestra:<br>`<span class="vital-chip">🌡️ <strong>38.7</strong> °C</span>`<br>✅ Input type="number" acepta decimales<br>✅ Backend (Django FloatField) almacena correctamente |
| **TC-039** | **Edge Case: Peso con 2 Decimales** | 1. Login como Veterinario<br>2. Crear ficha con Peso: **4.75** kg<br>3. Guardar y verificar | ✅ **ÉXITO**: Peso se almacena y muestra correctamente<br>✅ Chip muestra: `⚖️ <strong>4.75</strong> kg` |

---

### **Sección 2: Tabla de Receta Dinámica**

| ID | Escenario | Pasos a Realizar | Resultado Esperado |
|----|-----------|------------------|-------------------|
| **TC-009** | **Tabla Receta: Agregar Fila Vacía** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Activar checkbox "Agregar Tratamiento"<br>4. Click en botón **"+ Agregar Medicamento"**<br>5. NO llenar ningún campo de la nueva fila<br>6. Llenar campos obligatorios (Motivo/Diagnóstico)<br>7. Click en "Guardar Ficha" | ✅ **ÉXITO**: Según código (línea 750), filas vacías se ignoran:<br>- `if (nombre) { medicamentos.push(...) }`<br>✅ Ficha se guarda SIN el medicamento vacío<br>✅ Modal cierra normalmente |
| **TC-010** | **Tabla Receta: Agregar Medicamento con Nombre pero Sin Cantidad** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Agregar medicamento:<br>   - Nombre: "Amoxicilina"<br>   - Cantidad: **VACÍO**<br>   - Unidad: "mg"<br>   - Frecuencia: "c/12h"<br>4. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert "Receta Incompleta" con HTML:<br>- "Faltan detalles de dosificación para el medicamento:"<br>- "**Amoxicilina**"<br>- "(Debe especificar: Cantidad, Unidad y Frecuencia)"<br>✅ Modal NO se cierra |
| **TC-011** | **Tabla Receta: Medicamento con Cantidad Negativa** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Agregar medicamento:<br>   - Nombre: "Ibuprofeno"<br>   - Cantidad: **-10**<br>   - Unidad: "mg"<br>   - Frecuencia: "c/8h"<br>4. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert "Cantidad Inválida" con mensaje:<br>"La cantidad de 'Ibuprofeno' debe ser mayor a 0."<br>✅ Validación en línea 645 del código |
| **TC-012** | **Tabla Receta: Medicamento con Cantidad Cero** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Agregar:<br>   - Nombre: "Paracetamol"<br>   - Cantidad: **0**<br>   - Resto completo<br>4. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert "Cantidad Inválida"<br>✅ Validación `parseFloat(cantidad) <= 0` detecta cero |
| **TC-013** | **Tabla Receta: Medicamento Sin Unidad** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Agregar:<br>   - Nombre: "Aspirina"<br>   - Cantidad: "50"<br>   - Unidad: **"Seleccionar"** (vacío)<br>   - Frecuencia: "c/24h"<br>4. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert "Receta Incompleta" para "Aspirina"<br>✅ Requiere Cantidad, Unidad Y Frecuencia (línea 633) |
| **TC-014** | **Tabla Receta: Medicamento Sin Frecuencia** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Agregar:<br>   - Nombre: "Cefalexina"<br>   - Cantidad: "100"<br>   - Unidad: "mg"<br>   - Frecuencia: **"Seleccionar"** (vacío)<br>4. Click en "Guardar Ficha" | ❌ **ERROR**: SweetAlert "Receta Incompleta"<br>✅ Validación completa en línea 633-642 |
| **TC-015** | **Tabla Receta: Agregar y Eliminar Fila** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Click en "+ Agregar Medicamento" **3 veces** (ahora hay 4 filas totales)<br>4. Click en botón rojo "X" de la segunda fila<br>5. Verificar DOM | ✅ **ÉXITO**: Fila se elimina correctamente<br>✅ Quedan 3 filas en el DOM<br>✅ Función `eliminarFila()` (línea 543) ejecuta `.remove()` en el elemento padre |
| **TC-016** | **Tabla Receta: Intentar Eliminar Última Fila** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento" (queda 1 fila por defecto)<br>3. Click en botón rojo "X" de esa única fila | ❌ **BLOQUEO**: Aparece `alert()` nativo del navegador:<br>"Debe mantener al menos un medicamento en la receta."<br>✅ Fila NO se elimina (línea 548-551) |
| **TC-017** | **Tabla Receta: Eliminar Filas Hasta Quedar 1** | 1. Login como Veterinario<br>2. Agregar 5 medicamentos (6 filas totales)<br>3. Eliminar una por una hasta quedar 2<br>4. Intentar eliminar la penúltima | ✅ **ÉXITO**: Penúltima fila se elimina<br>✅ Queda 1 fila final<br>✅ Botón "X" de esa última fila muestra alert si se intenta eliminar |
| **TC-018** | **Tabla Receta: Guardar Múltiples Medicamentos** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Agregar 3 medicamentos completos:<br>   - Med1: Amoxicilina 500mg c/12h 7 días<br>   - Med2: Meloxicam 0.1mg c/24h 3 días<br>   - Med3: Omeprazol 20mg c/24h 5 días<br>4. Llenar Motivo/Diagnóstico<br>5. Click en "Guardar Ficha" | ✅ **ÉXITO**: SweetAlert muestra:<br>"La consulta y **3** tratamiento(s) se han registrado correctamente."<br>✅ Pregunta: "¿Deseas imprimir la receta?"<br>✅ Modal se cierra<br>✅ Timeline se recarga con nueva tarjeta<br>✅ Tarjeta muestra 3 tratamientos en cajas amarillas (#fff3cd) |
| **TC-019** | **Tabla Receta: Verificar Unidades en Timeline** | 1. Completar TC-018<br>2. Buscar la tarjeta recién creada en el timeline<br>3. Expandir tarjeta (si es colapsable) o verificar visualmente<br>4. Leer los tratamientos mostrados | ✅ **ÉXITO**: Cada tratamiento muestra:<br>- Icono 💊 (fas fa-pills)<br>- Nombre del medicamento en **negrita**<br>- Descripción formateada: "500 mg c/12h por 7 días"<br>✅ Formato según línea 780-783 del código |
| **TC-027** | **Tabla Receta: Duración Opcional Vacía** | 1. Login como Veterinario<br>2. Activar "Agregar Tratamiento"<br>3. Agregar medicamento:<br>   - Nombre: "Tramadol"<br>   - Cantidad: "50"<br>   - Unidad: "mg"<br>   - Frecuencia: "c/8h"<br>   - Duración: **VACÍO**<br>4. Click en "Guardar Ficha" | ✅ **ÉXITO**: Tratamiento se guarda sin duración<br>✅ Descripción formateada será: "50 mg c/8h" (SIN "por X días")<br>✅ Código línea 783: `if (med.duracion)` condiciona la adición<br>✅ `fecha_fin: null` (línea 793) |
| **TC-028** | **Tabla Receta: Verificar Fechas Calculadas** | 1. Login como Veterinario<br>2. Agregar tratamiento con Duración: **7 días**<br>3. Guardar ficha<br>4. Verificar en Base de Datos (panel admin o query SQL):<br>   - Tabla `core_tratamiento`<br>   - Campo `fecha_inicio` y `fecha_fin` | ✅ **ÉXITO**:<br>- `fecha_inicio` = Fecha actual (formato YYYY-MM-DD)<br>- `fecha_fin` = Fecha actual + 7 días<br>✅ Cálculo en función `calcularFechaFin()` línea 837-841 |
| **TC-031** | **Tabla Receta: Checkbox OFF No Guarda Tratamientos** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Activar checkbox "Agregar Tratamiento"<br>4. Agregar medicamentos<br>5. **DESACTIVAR** checkbox antes de guardar<br>6. Click en "Guardar Ficha" | ✅ **ÉXITO**: Solo se guarda la ficha clínica<br>✅ NO se ejecuta `guardarTratamientos()`<br>✅ Código línea 691: `if (document.getElementById('agregarTratamiento').checked)`<br>✅ SweetAlert muestra: "La consulta se ha registrado correctamente" (SIN mención de tratamientos) |
| **TC-032** | **Tabla Receta: Verificar Estructura de Descripción** | 1. Crear tratamiento:<br>   - Nombre: "Enrofloxacina"<br>   - Cantidad: 5<br>   - Unidad: ml<br>   - Frecuencia: c/12h<br>   - Duración: 10<br>2. Guardar y verificar en DB | ✅ **ÉXITO**: Campo `descripcion` contiene:<br>"5 ml c/12h por 10 días"<br>✅ Formato exacto según línea 780-783 |

---

### **Sección 3: Flujo Visual y AJAX**

| ID | Escenario | Pasos a Realizar | Resultado Esperado |
|----|-----------|------------------|-------------------|
| **TC-020** | **Flujo AJAX: Modal Cierra Sin Recarga Completa** | 1. Login como Veterinario<br>2. Abrir historial de paciente<br>3. Scroll hasta el final del timeline<br>4. Abrir modal "Nueva Consulta"<br>5. Llenar datos mínimos (sin tratamiento)<br>6. Click en "Guardar Ficha"<br>7. Observar comportamiento del navegador | ✅ **ÉXITO**: Modal se cierra con `modalFicha.hide()` (línea 695)<br>✅ Se ejecuta `cargarTimelineFichas()` (línea 696) que hace fetch a `/api/fichas/?paciente=${pacienteId}`<br>✅ NO hay recarga completa de página (`window.location.reload()` NO existe en el código)<br>✅ Timeline se re-renderiza dinámicamente<br>✅ Scroll position NO se pierde |
| **TC-021** | **Flujo Visual: Nueva Tarjeta Aparece Primero** | 1. Completar TC-020<br>2. Observar el timeline inmediatamente después de guardar | ✅ **ÉXITO**: Nueva tarjeta aparece en la **PRIMERA posición** del timeline<br>✅ Razón: Línea 233 ordena fichas descendentes:<br>`fichas.sort((a, b) => new Date(b.fecha_consulta) - new Date(a.fecha_consulta))`<br>✅ Tarjeta tiene animación de aparición (si CSS lo define) |
| **TC-022** | **Flujo Visual: Badge Automático "Vacunación"** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar Motivo: **"Control de vacunación anual"**<br>4. Llenar Diagnóstico: "Aplicada vacuna polivalente"<br>5. Guardar y verificar tarjeta en timeline | ✅ **ÉXITO**: Tarjeta muestra badge verde:<br>`<span class="badge bg-success">💉 Vacunación</span>`<br>✅ Detección por keyword "vacuna" en línea 281 |
| **TC-023** | **Flujo Visual: Badge Automático "Cirugía"** | 1. Login como Veterinario<br>2. Crear ficha con Motivo: **"Cirugía de esterilización"**<br>3. Guardar y verificar | ✅ **ÉXITO**: Badge rojo:<br>`<span class="badge bg-danger">🏥 Cirugía</span>`<br>✅ Keyword "cirugía" detectado (línea 283) |
| **TC-024** | **Flujo Visual: Badge Automático "Control"** | 1. Login como Veterinario<br>2. Crear ficha con Motivo: **"Control rutinario mensual"**<br>3. Guardar y verificar | ✅ **ÉXITO**: Badge azul claro:<br>`<span class="badge bg-info">✅ Control</span>`<br>✅ Keyword "control" detectado |
| **TC-025** | **Flujo Visual: Badge Default "Consulta"** | 1. Login como Veterinario<br>2. Crear ficha con Motivo: **"Dolor abdominal"**<br>3. Guardar y verificar | ✅ **ÉXITO**: Badge azul primario:<br>`<span class="badge bg-primary">🩺 Consulta</span>`<br>✅ Default cuando no hay keywords específicos |
| **TC-033** | **Flujo Visual: Imprimir Receta** | 1. Crear ficha con 2 tratamientos<br>2. Click en "Guardar Ficha"<br>3. En SweetAlert, click en botón:<br>   "🖨️ Imprimir Receta"<br>4. Observar ventana de impresión | ✅ **ÉXITO**: Se abre diálogo de impresión del navegador<br>✅ Ejecuta función `imprimirReceta(medicamentos, fichaId)` línea 903<br>✅ Genera HTML con:<br>- Logo veterinaria<br>- Datos del paciente<br>- Tabla de medicamentos<br>- Fecha y veterinario<br>✅ CSS `@media print` aplicado |
| **TC-037** | **Edge Case: Motivo con Keyword Múltiple** | 1. Login como Veterinario<br>2. Crear ficha con Motivo:<br>   **"Revisión pre-cirugía y control de vacunas"**<br>3. Guardar y verificar badge | ⚠️ **RESULTADO**: Badge será **"🏥 Cirugía"** (rojo)<br>✅ Código evalúa keywords en orden (línea 281-287)<br>✅ Primera coincidencia gana (`else if` secuencial)<br>📝 **NOTA**: Si se requiere prioridad diferente, reordenar condiciones |
| **TC-040** | **Regresión: Cambios en Ficha No Persisten Sin Guardar** | 1. Login como Veterinario<br>2. Abrir modal "Nueva Consulta"<br>3. Llenar TODOS los campos<br>4. NO hacer click en "Guardar"<br>5. Click en botón "Cancelar" o "X" del modal<br>6. Reabrir modal | ✅ **ÉXITO**: Modal aparece vacío (campos reseteados)<br>✅ Función `abrirModalFicha()` línea 410 resetea form<br>✅ No hay persistencia de datos no guardados |

---

### **Sección 4: Control de Acceso y Seguridad**

| ID | Escenario | Pasos a Realizar | Resultado Esperado |
|----|-----------|------------------|-------------------|
| **TC-029** | **Error Handling: Sin Token JWT** | 1. Abrir DevTools → Application → Local Storage<br>2. Eliminar `accessToken`<br>3. Intentar abrir `/historial/?paciente_id=1` | ✅ **ÉXITO**: Redirección automática a `/login/`<br>✅ Código línea 161: `if (!token) { window.location.href = '/login/' }` |
| **TC-030** | **Error Handling: Paciente ID Inválido** | 1. Login como Veterinario<br>2. Modificar URL manualmente:<br>   `/historial/?paciente_id=99999`<br>3. Presionar Enter | ❌ **ERROR 404**: Fetch a `/api/pacientes/99999/` devuelve error<br>✅ Console muestra: "Error cargando perfil: ..."<br>✅ Aparece mensaje de error en pantalla (función `mostrarError()` línea 864) |
| **TC-035** | **Acceso: Tutor Intenta Crear Ficha** | 1. Login como **Tutor** (no Veterinario)<br>2. Ir a `/portal/`<br>3. Click en paciente → Ver Historial<br>4. Buscar botón "Nueva Consulta" | ✅ **ÉXITO**: Botón "Nueva Consulta" NO aparece en DOM<br>✅ Modal NO se renderiza para tutores<br>✅ Sidebar oculto (`display: none` línea 128)<br>✅ Vista es solo lectura |
| **TC-036** | **Acceso: Tutor Intenta POST Directo** | 1. Login como Tutor<br>2. Abrir DevTools → Console<br>3. Ejecutar:<br>```javascript<br>fetch('/api/fichas/', {<br>  method: 'POST',<br>  headers: {'Authorization': 'Bearer ' + localStorage.getItem('accessToken'), 'Content-Type': 'application/json'},<br>  body: JSON.stringify({paciente: 1, motivo: 'Hack', diagnostico: 'Test'})<br>})<br>```<br>4. Verificar respuesta | ❌ **ERROR 403 FORBIDDEN**: Backend rechaza petición<br>✅ DRF permissions bloquean acceso de tutores<br>✅ Solo Veterinarios/Asistentes/Administradores pueden crear fichas |

---

### **Sección 5: Performance y Edge Cases**

| ID | Escenario | Pasos a Realizar | Resultado Esperado |
|----|-----------|------------------|-------------------|
| **TC-034** | **Performance: Timeline con 50 Fichas** | 1. Login como Veterinario<br>2. Seleccionar paciente con historial extenso (50+ fichas)<br>3. Medir tiempo de carga del timeline<br>4. Verificar scroll y renderizado | ✅ **ÉXITO**: Timeline carga en < 2 segundos<br>✅ Scroll es fluido<br>✅ No hay lag en hover effects<br>⚠️ **POSIBLE MEJORA**: Implementar paginación o lazy loading si > 100 fichas |

---

## 📊 RESUMEN DE COBERTURA

| **Categoría** | **Cantidad de Casos** | **IDs** |
|---------------|-----------------------|---------|
| Validaciones de Signos Vitales | 11 casos | TC-001 a TC-008, TC-026, TC-038, TC-039 |
| Tabla de Receta Dinámica | 15 casos | TC-009 a TC-019, TC-027, TC-028, TC-031, TC-032 |
| Flujo Visual y AJAX | 9 casos | TC-020 a TC-025, TC-033, TC-037, TC-040 |
| Control de Acceso | 4 casos | TC-029, TC-030, TC-035, TC-036 |
| Performance | 1 caso | TC-034 |
| **TOTAL** | **40 Casos de Prueba** | - |

---

## 🔍 BUGS POTENCIALES DETECTADOS EN ANÁLISIS DE CÓDIGO

| **ID** | **Severidad** | **Descripción** | **Ubicación** | **Recomendación** |
|--------|---------------|-----------------|---------------|-------------------|
| **BUG-001** | 🟡 **MEDIA** | **Alert Nativo en Eliminación de Fila**: Usa `alert()` del navegador en lugar de SweetAlert2 para consistencia visual | Línea 548 `historial.js` | Reemplazar con:<br>```javascript<br>Swal.fire({<br>  title: 'No se puede eliminar',<br>  text: 'Debe mantener al menos un medicamento en la receta.',<br>  icon: 'warning',<br>  confirmButtonColor: '#0061ff'<br>});<br>``` |
| **BUG-002** | 🟢 **BAJA** | **Orden de Keywords en Badge**: Si motivo contiene múltiples keywords, solo la primera coincidencia se usa. Puede causar clasificación incorrecta. | Líneas 281-287 `historial.js` | Documentar comportamiento en código o implementar sistema de prioridad con pesos |
| **BUG-003** | 🔴 **ALTA** | **Falta Validación en Input HTML**: Campos `<input type="number">` no tienen atributos `min`, `max`, `step` que refuercen validación del lado del cliente | Template HTML (modal de ficha) | Agregar atributos HTML5:<br>```html<br><input type="number" min="0.01" step="0.01" id="ficha-peso"><br><input type="number" min="35" max="43" step="0.1" id="ficha-temperatura"><br><input type="number" min="0.01" step="0.01" name="med_cantidad[]"><br>``` |
| **BUG-004** | 🟡 **MEDIA** | **Error Handling Incompleto**: Si `guardarTratamientos()` falla parcialmente (algunos POST exitosos, otros no), solo muestra warning genérico. No indica CUÁLES fallaron. | Línea 820-827 `historial.js` | Modificar `Promise.all()` para capturar errores individuales:<br>```javascript<br>Promise.allSettled(promesas).then(results => {<br>  const fallidos = results.filter(r => r.status === 'rejected');<br>  if (fallidos.length > 0) {<br>    // Mostrar detalle de medicamentos fallidos<br>  }<br>});<br>``` |
| **BUG-005** | 🟢 **BAJA** | **ID Tutor en Perfil**: Muestra `ID: 5` en lugar del nombre del tutor (requiere fetch adicional o eager loading) | Línea 198 `historial.js` | Modificar API de pacientes para incluir `tutor_nombre` en la respuesta:<br>```python<br># serializers.py<br>class PacienteSerializer(serializers.ModelSerializer):<br>    tutor_nombre = serializers.CharField(source='tutor.user.get_full_name', read_only=True)<br>``` |

---

## 📊 MATRIZ DE PRIORIZACIÓN DE PRUEBAS

| **Prioridad** | **Casos a Ejecutar Primero** | **Justificación** |
|---------------|------------------------------|-------------------|
| **🔴 CRÍTICA** | TC-007, TC-008, TC-001, TC-003, TC-010, TC-011, TC-036 | Validaciones obligatorias que previenen datos inconsistentes + Seguridad de acceso por roles |
| **🟡 ALTA** | TC-018, TC-020, TC-022, TC-023, TC-024, TC-025, TC-015, TC-016 | Flujos principales de uso diario (AJAX, badges automáticos, gestión de filas) |
| **🟢 MEDIA** | TC-027, TC-028, TC-033, TC-031, TC-038, TC-039, TC-019 | Edge cases y funcionalidades opcionales (duración vacía, impresión, decimales) |
| **⚪ BAJA** | TC-034, TC-037, TC-040, TC-009, TC-026 | Performance, casos de regresión y validaciones permisivas |

---

## 🎯 CRITERIOS DE ACEPTACIÓN

### ✅ **Criterios de ÉXITO del Módulo**

1. **Todas las validaciones críticas (TC-001 a TC-008, TC-010 a TC-014)** deben bloquear el guardado con mensajes claros
2. **El flujo AJAX (TC-020)** no debe recargar la página completa
3. **Los badges automáticos (TC-022 a TC-025)** deben aparecer correctamente
4. **Tutores (TC-035, TC-036)** NO deben poder crear ni modificar fichas
5. **Tabla de medicamentos** debe permitir agregar/eliminar filas sin errores JavaScript
6. **Cálculo de fechas (TC-028)** debe ser preciso (fecha_fin = fecha_inicio + duración)

### ❌ **Criterios de FALLO**

- Cualquier caso crítico (🔴) que falle
- Más de 2 casos de alta prioridad (🟡) fallando
- Errores JavaScript en consola durante operaciones normales
- Modal que se cierra sin guardar datos (pérdida de información)
- Timeline que requiere recarga manual (F5) para ver cambios

---

## 📝 NOTAS ADICIONALES

### **Ambiente de Pruebas Recomendado**

- **Navegadores**: Chrome 120+, Firefox 121+, Edge 120+
- **Dispositivos**: Desktop (1920x1080), Tablet (768px), Mobile (375px)
- **Datos de Prueba**: Al menos 5 pacientes con 0, 1, 5, 20 y 50 fichas respectivamente
- **Usuarios de Prueba**:
  - Veterinario: `vet@test.com` / `pass123`
  - Tutor: `tutor@test.com` / `pass123`
  - Administrador: `admin@test.com` / `pass123`

### **Herramientas Útiles**

- **SweetAlert2 Debugger**: Activar `allowOutsideClick: false` para inspeccionar modales
- **Network Tab**: Monitorear requests POST a `/api/fichas/` y `/api/tratamientos/`
- **Console Logs**: Habilitar logs detallados en `historial.js` (líneas 207, 254, 706)
- **Database Browser**: Inspeccionar directamente tablas `core_fichaclinica` y `core_tratamiento`

### **Regresión Automática**

Se recomienda convertir estos casos manuales en tests automatizados usando:
- **Selenium/Playwright** para TC-020 a TC-025 (flujo visual)
- **Jest/Mocha** para validaciones JavaScript (TC-001 a TC-014)
- **Django Tests** para permisos de API (TC-036)

---

## ✍️ REGISTRO DE EJECUCIÓN

| **Fecha** | **Ejecutado Por** | **Casos Ejecutados** | **Casos Pasados** | **Casos Fallidos** | **Notas** |
|-----------|-------------------|----------------------|-------------------|--------------------|-----------|
| _TBD_ | _Nombre del QA_ | _0/40_ | _0_ | _0_ | _Pendiente primera ejecución_ |

---

**Fin del Plan de Pruebas** 🎉

**Próximos Pasos:**
1. Ejecutar casos de prioridad CRÍTICA (🔴)
2. Reportar bugs encontrados con screenshots y logs de consola
3. Crear tickets en sistema de gestión de proyectos
4. Implementar correcciones sugeridas en sección de BUGS POTENCIALES
