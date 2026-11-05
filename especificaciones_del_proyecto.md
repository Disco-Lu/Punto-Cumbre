# Especificación de Funcionalidad: Plataforma Punto Cumbre Outdoor

## 1. Visión General
Esta especificación define los requerimientos para la plataforma de arriendo de equipamiento de montaña "Punto Cumbre Outdoor". El sistema se divide en una interfaz pública para clientes (exploración de catálogo, disponibilidad y cotización) y un panel privado para administradores (gestión de inventario y reservas).

## 2. Historias de Usuario Priorizadas

### P1: Flujo Core de Cliente (MVP)
* **HU01**: Como cliente, quiero visualizar un catálogo de equipamiento categorizado para conocer las opciones disponibles.
* **HU02**: Como cliente, quiero consultar la ficha técnica de un equipo para conocer sus características, precio y condiciones de arriendo.
* **HU03**: Como cliente, quiero seleccionar fechas de retiro y devolución para conocer la disponibilidad del equipamiento.
* **HU04**: Como cliente, quiero solicitar una cotización indicando el equipamiento que necesito para iniciar el proceso de arriendo.
* **HU05**: Como cliente, quiero recibir un resumen de mi solicitud para conocer los equipos, fechas y valores considerados.

### P2: Gestión Administrativa y Operación
* **HU07**: Como administrador, quiero gestionar el catálogo para agregar equipos y actualizar su información y precios.
* **HU08**: Como administrador, quiero gestionar la disponibilidad de los equipos para mantener actualizado el inventario.
* **HU09**: Como administrador, quiero actualizar el estado de las reservas para mantener controlado el proceso de arriendo.
* **HU10**: Como administrador, quiero recibir una notificación cuando se genere una nueva solicitud para poder atenderla oportunamente.

### P3: Historial y Servicios Secundarios
* **HU06**: Como cliente, quiero consultar información sobre los servicios de reparación para conocer las alternativas disponibles para mi equipo.
* **HU11**: Como cliente, quiero consultar mis reservas para conocer el estado de mis solicitudes actuales y anteriores.

---

## 3. Criterios de Aceptación y Casos Borde (Sintaxis Gherkin)

### P1: Flujo Core de Cliente

#### HU01: Visualizar catálogo categorizado
* **Requisito Funcional**: Agrupar equipos mediante categorías jerárquicas navegables.
* **Escenario Principal**: Visualización exitosa
  * **Dado** que un cliente ingresa a la vista principal de la plataforma
  * **Cuando** navega a la sección de "Catálogo"
  * **Entonces** el sistema despliega las categorías principales y lista los equipos activos correspondientes a cada una.
* **Caso Borde**: Categorías sin stock. **Entonces** la categoría se muestra deshabilitada o se oculta dinámicamente.

#### HU02: Consultar ficha técnica
* **Requisito Funcional**: Mostrar especificaciones (talla, peso, material), precio diario y condiciones.
* **Escenario Principal**: Carga de ficha de equipo
  * **Dado** que un cliente está visualizando el catálogo
  * **Cuando** hace clic sobre la tarjeta de un equipo específico
  * **Entonces** el sistema redirige a la vista de detalle mostrando la información técnica completa y el precio diario.
* **Caso Borde**: Equipo descontinuado/inactivo. **Entonces** si se accede por URL directa, el sistema muestra una vista de "Equipo no disponible" (Error 404 personalizado).

#### HU03: Seleccionar fechas y ver disponibilidad
* **Requisito Funcional**: Motor de disponibilidad que cruce reservas activas con inventario total.
* **Escenario Principal**: Validación de stock en fechas
  * **Dado** que el cliente se encuentra en la ficha técnica de un equipo
  * **Cuando** selecciona una "Fecha de Retiro" y una "Fecha de Devolución" válidas
  * **Entonces** el sistema valida el inventario e indica si hay unidades disponibles, habilitando la opción de cotizar.
* **Caso Borde**: Fechas invertidas o en el pasado. **Entonces** el selector de fechas debe bloquear selecciones inválidas mediante validación de frontend.

#### HU04 & HU05: Solicitar cotización y recibir resumen
* **Requisito Funcional**: Carrito de cotización con formulario de contacto y vista de confirmación.
* **Escenario Principal**: Envío de solicitud exitosa
  * **Dado** que el cliente ha agregado equipos disponibles a su cotización
  * **Cuando** completa el formulario con sus datos personales y presiona "Solicitar Arriendo"
  * **Entonces** el sistema guarda la solicitud en estado "Pendiente" y despliega una pantalla de resumen detallando el folio, equipos, fechas y valor total estimado.
* **Caso Borde**: Falla de conexión al guardar. **Entonces** el sistema retiene los datos en el formulario y muestra un mensaje sugiriendo reintentar.

---

### P2: Gestión Administrativa y Operación

#### HU07: Gestionar catálogo (CRUD)
* **Requisito Funcional**: Panel de administración protegido por autenticación para crear/editar equipos.
* **Escenario Principal**: Creación de nuevo equipo
  * **Dado** que el administrador inició sesión y está en el panel de inventario
  * **Cuando** completa el formulario de "Nuevo Equipo" (nombre, categoría, precio, stock base) y lo guarda
  * **Entonces** el equipo se registra en la base de datos y aparece inmediatamente visible en el catálogo público.
* **Caso Borde**: Intento de creación con datos faltantes. **Entonces** el sistema resalta los campos obligatorios y bloquea la creación.

#### HU08: Gestionar disponibilidad de equipos
* **Requisito Funcional**: Ajuste manual de stock por mantención o pérdida.
* **Escenario Principal**: Bloqueo de equipo por mantención
  * **Dado** que el administrador está en el panel de inventario
  * **Cuando** ajusta la cantidad disponible de un equipo específico reduciendo su stock operativo
  * **Entonces** el sistema recalcula la disponibilidad futura y bloquea nuevas cotizaciones que excedan este nuevo límite.
* **Caso Borde**: Reducción de stock afectando reservas existentes. **Entonces** el sistema advierte al administrador qué reservas "Pendientes" o "Aprobadas" se verán comprometidas.

#### HU09: Actualizar estado de reservas
* **Requisito Funcional**: Flujo de estados: Pendiente -> Aprobada -> Entregada -> Devuelta.
* **Escenario Principal**: Aprobación de cotización
  * **Dado** que el administrador revisa una solicitud en estado "Pendiente"
  * **Cuando** cambia el estado de la solicitud a "Aprobada"
  * **Entonces** el inventario queda formalmente reservado para esas fechas y la solicitud cambia de estado en el sistema.
* **Caso Borde**: Cancelación de reserva. **Entonces** el inventario bloqueado se libera automáticamente para estar disponible a otros clientes.

#### HU10: Recibir notificación de nueva solicitud
* **Requisito Funcional**: Envío de alertas vía correo electrónico/webhook al administrador.
* **Escenario Principal**: Notificación automática
  * **Dado** que un cliente confirma exitosamente una nueva solicitud de arriendo (HU04)
  * **Cuando** el registro se inserta en la base de datos
  * **Entonces** el sistema despacha inmediatamente un correo de alerta al administrador con el enlace a la nueva solicitud.
* **Caso Borde**: Falla en el servicio de correo. **Entonces** la solicitud se crea normalmente pero se registra el error de envío en los logs del servidor para revisión.

---

### P3: Historial y Servicios Secundarios

#### HU06: Consultar servicios de reparación
* **Requisito Funcional**: Página estática/informativa sobre taller.
* **Escenario Principal**: Visualización de servicios
  * **Dado** que un cliente navega por el sitio principal
  * **Cuando** hace clic en el enlace "Servicio Técnico/Reparaciones"
  * **Entonces** visualiza un listado de servicios de mantenimiento (ej. afilado de piolets, lavado de sacos) y sus tarifas estimadas.

#### HU11: Consultar historial de reservas
* **Requisito Funcional**: Área de cliente (requiere registro/login o validación por token/email).
* **Escenario Principal**: Revisión de historial
  * **Dado** que el cliente ha iniciado sesión (o ingresado su identificador)
  * **Cuando** navega a la sección "Mis Reservas"
  * **Entonces** visualiza una lista cronológica de sus solicitudes con el estado actual de cada una.