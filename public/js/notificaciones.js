
// Array de datos JSON proporcionado
let notificacionesData = [];



document.addEventListener('DOMContentLoaded', () => {
    iniciarCargaNotificaciones();
    setupDropdownToggle();
    setupNotificationClickHandlers();

});


async function initNotifications() {
    // Usar la variable global
    const userId = parseInt(window.APP_USER.id) || 0;
    console.log('initNotifications userId', userId)
    socket = io();

    socket.on('connect', () => {
        socket.emit('authenticate', userId);
    });

    socket.on('nueva_notificacion', (notif) => {
        console.log(notif)
        notificacionesData.push(notif);
        console.log(notificacionesData)

        renderNotificaciones();

    });
}


// Función de utilidad para obtener íconos basados en el tipo de notificación
function getIconClass(tipo) {
    switch (tipo) {
        case 'Nueva Solicitud':
            return 'fas fa-file-alt'; // Documento/Archivo
        case 'Solicitud Aprobada':
            return 'fas fa-check-circle'; // Check/Aprobación
        case 'Nueva Orden Asignada':
            return 'fas fa-clipboard-list'; // Lista/Orden de trabajo
        case 'Orden Completada':
        case 'Trabajo Finalizado':
            return 'fas fa-flag-checkered'; // Finalizado/Bandera
        default:
            return 'fas fa-info-circle'; // Información genérica
    }
}

async function iniciarCargaNotificaciones() {
    await listarNotificaciones();

    renderNotificaciones();



}

async function listarNotificaciones() {


    // 2. Construir la URL completa
    const tipo = 'N';
    const url = `/api/simulacion/lista/${tipo}`;
    try {
        // 3. Petición Asíncrona: Espera la respuesta del servidor
        const respuesta = await fetch(url);

        // 4. Verificación de la respuesta HTTP
        if (!respuesta.ok) {
            // Lanza un error si el estado HTTP es 4xx o 5xx
            throw new Error(`Error en la red o servidor: Estado ${respuesta.status}`);
        }

        // 5. Conversión Asíncrona: Espera la lectura y parseo del cuerpo a JSON
        const datos = await respuesta.json();

        notificacionesData = datos.data; // Asumiendo que tu controlador devuelve { data: [...] }
        //  console.log(equipos)
    } catch (error) {
        // Captura errores de red, fallos de fetch, o errores lanzados arriba
        console.error("Falló la búsqueda de solicitudes:", error.message);
        // Podrías retornar un array vacío o relanzar el error
        notificacionesData = [];
    }
}

async function marcarLeida(id) {


    // 2. Construir la URL completa

    const url = `/api/simulacion/notificacion/${id}`;
    try {
        // 3. Petición Asíncrona: Espera la respuesta del servidor
        const respuesta = await fetch(url);

        // 4. Verificación de la respuesta HTTP
        if (!respuesta.ok) {
            // Lanza un error si el estado HTTP es 4xx o 5xx
            throw new Error(`Error en la red o servidor: Estado ${respuesta.status}`);
        }

        // 5. Conversión Asíncrona: Espera la lectura y parseo del cuerpo a JSON
        const datos = await respuesta.json();
        guardarMsjTemporal('succes', datos.message)

    } catch (error) {
        // Captura errores de red, fallos de fetch, o errores lanzados arriba
        console.error("Falló la marcacion de la notificacion:", error.message);
        // Podrías retornar un array vacío o relanzar el error

    }
}

// Función para marcar una notificación como leída
/* function markAsRead(notificationId) {
    // Convertimos el ID a número ya que el ID en el objeto es numérico
    const idNum = parseInt(notificationId, 10);

    const index = notificacionesData.findIndex(n => n.id === idNum);

    // Solo actualiza si la encuentra y si no estaba leída
    if (index !== -1 && notificacionesData[index].leida === false) {
        // En una app real, aquí harías una llamada a la API para persistir el cambio
        notificacionesData[index].leida = true;

        // Vuelve a renderizar para actualizar el estado visual y el badge.
        marcarLeida(notificationId);

        console.log(`Notificación #${idNum} marcada como leída.`);
    }
} */

// Configura los event listeners para las notificaciones (usando delegación)
function setupNotificationClickHandlers() {
    const listContainer = document.getElementById('lista-notificaciones');

    // Usamos delegación de eventos en el contenedor principal (ul)
    listContainer.addEventListener('click', async (e) => {
        // Busca el elemento <li> padre que contenga el ID de la notificación
        const clickedItem = e.target.closest('.notification-item');
        const noclick = e.target.closest('.leida');
        if (clickedItem && !noclick) {
            const notificationId = clickedItem.getAttribute('data-notification-id');

            if (notificationId) {
                // Marcar como leída antes de la posible navegación/acción
                marcarLeida(notificationId);

                await listarNotificaciones();
                renderNotificaciones();
            }
            // Nota: Si quieres que el menú se cierre al hacer clic, descomenta la línea siguiente:
            document.getElementById('dropdown-menu').classList.add('hidden');
        }
    });
}

// Función para formatear la fecha de forma relativa (Ahora, Hace X min/horas)
function formatRelativeDate(isoDate) {
    const now = new Date();
    const past = new Date(isoDate);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.round(diffMs / 60000); // Diferencia en minutos

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 24 * 60) return `Hace ${Math.round(diffMins / 60)} horas`;

    // Si es más de 24 horas, muestra la fecha local corta
    return past.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función principal para renderizar las notificaciones y actualizar el contador
// Función principal para renderizar las notificaciones y actualizar el contador
function renderNotificaciones() {
    const container = document.getElementById('lista-notificaciones');
    const badge = document.getElementById('notification-count');
    const placeholder = document.getElementById('no-notifications-placeholder');

    container.innerHTML = '';

    // 1. Contar Notificaciones No Leídas
    const notificacionesNoLeidas = notificacionesData.filter(n => !n.leida);
    const totalNoLeidas = notificacionesNoLeidas.length;

    // 2. Actualizar el Contador (Badge)
    if (totalNoLeidas > 0) {
        badge.textContent = totalNoLeidas > 99 ? '99+' : totalNoLeidas;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    // 3. Renderizar las Notificaciones en el Dropdown
    if (notificacionesData.length === 0) {
        placeholder.classList.remove('hidden');
        return;
    }

    placeholder.classList.add('hidden');

    // Ordenamos para que las no leídas aparezcan primero
    const notificacionesOrdenadas = [...notificacionesData].sort((a, b) => {
        // Las notificaciones no leídas (false) van antes que las leídas (true)
        if (a.leida !== b.leida) {
            return a.leida ? 1 : -1;
        }
        // Si tienen el mismo estado de lectura, ordenamos por fecha descendente
        return new Date(b.fecha) - new Date(a.fecha);
    });


    const notificacionesHTML = notificacionesOrdenadas.map(notificacion => {
        // Clases dinámicas
        const classLeida = notificacion.leida ? 'leida' : '';

        // Vínculo
        const vinculoUrl = '#';//`#${notificacion.vinculo_tipo.toLowerCase()}/${notificacion.vinculo_id}`;
        const vinculoTexto = `${notificacion.vinculo_tipo} #${notificacion.vinculo_id}`;

        // Ícono
        const iconClass = getIconClass(notificacion.tipo);
        const fechaRelativa = formatRelativeDate(notificacion.fecha);

        // Plantilla HTML para una sola notificación
        // NOTA: Añadimos el atributo data-notification-id al <li>
        return `
                    <li class="notification-item ${classLeida}" data-notification-id="${notificacion.id}">
                        <a href="${vinculoUrl}" class="notification-content">
                            <!-- Ícono -->
                            <div class="notification-icon-wrapper" style="${notificacion.leida ? 'background-color: #6b7280; opacity: 0.8;' : ''}">
                                <i class="${iconClass}"></i>
                            </div>
                            
                            <div class="notification-details">
                                <div class="notification-type">
                                    ${notificacion.tipo}
                                </div>
                                
                                <p class="notification-message">
                                    ${notificacion.mensaje}
                                </p>
                                
                                <div class="notification-metadata">
                                    <span class="notification-time">${fechaRelativa}</span>
                                    <span class="notification-link">${vinculoTexto}</span>
                                </div>
                            </div>
                        </a>
                    </li>
                `;
    }).join('');

    container.innerHTML = notificacionesHTML;
}

// --- Lógica del Dropdown (Abrir/Cerrar) ---
function setupDropdownToggle() {
    const button = document.getElementById('profileButton');
    const dropdown = document.getElementById('profileDropdown');

    // Toggle la visibilidad al hacer clic en la campana
    button.addEventListener('click', (e) => {

        e.stopPropagation(); // Evita que el clic se propague al documento inmediatamente
        dropdown.classList.toggle('hidden');
    });

    // Cerrar el dropdown al hacer clic fuera de él
    document.addEventListener('click', (e) => {
        // Si el clic no fue dentro del contenedor de notificaciones
        if (!dropdown.classList.contains('hidden') && !e.target.closest('.notification-container')) {
            dropdown.classList.add('hidden');
        }
    });

    // ELIMINADA: La lógica que cerraba el menú desplegable al hacer scroll en la ventana.
    // Ahora solo se cerrará al hacer clic fuera del área del buzón.
}

// Inicialización

