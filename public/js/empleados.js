/**
 * JavaScript para la gestión de empleados
 * Requiere: common.js
 */

let loadCount = 0;

/**
 * Cargar empleados desde la API
 * @param {boolean} forceDB - Forzar consulta a BD sin cache
 */
async function loadEmpleados(forceDB = false) {
    const startTime = performance.now();
    const tbody = document.getElementById('empleadosTable');

    // Mostrar spinner de carga
    tbody.innerHTML = `
    <tr>
      <td colspan="6" class="loading">
        <div class="spinner"></div>
        ${forceDB ? 'Cargando desde Base de Datos...' : 'Cargando empleados...'}
      </td>
    </tr>
  `;

    try {
        const url = forceDB ? '/api/empleados?nocache=true' : '/api/empleados';
        const response = await fetch(url);
        const result = await response.json();

        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);

        if (result.success) {
            const empleados = result.data;

            // Actualizar estadísticas
            updateStats(empleados.length, loadTime, forceDB);

            // Renderizar tabla
            renderEmpleadosTable(empleados);

            loadCount++;
            console.log(`✓ Carga #${loadCount} completada en ${loadTime}ms`);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error al cargar empleados:', error);
        tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty" style="color: #dc3545;">
          ❌ Error al cargar empleados: ${error.message}
        </td>
      </tr>
    `;
    }
}

/**
 * Actualizar estadísticas en la UI
 */
function updateStats(count, loadTime, forceDB) {
    // Total empleados
    const totalElement = document.getElementById('totalEmpleados');
    if (totalElement) {
        totalElement.textContent = count;
    }

    // Tiempo de carga
    const timeElement = document.getElementById('loadTime');
    if (timeElement) {
        timeElement.textContent = loadTime + 'ms';
    }

    // Fuente de datos (cache es típicamente < 50ms)
    const sourceElement = document.getElementById('dataSource');
    if (sourceElement) {
        const source = loadTime < 50 && !forceDB ? '📦 Cache' : '🗄️ Base de Datos';
        sourceElement.textContent = source;
    }

    // Actualizar info de cache
    const cacheInfoElement = document.getElementById('cacheInfo');
    if (cacheInfoElement) {
        const badge = loadTime < 50 && !forceDB ?
            '<span class="badge badge-cache">✓ Desde Cache</span>' :
            '<span class="badge badge-db">Desde Base de Datos</span>';
        cacheInfoElement.innerHTML = `💾 ${badge} | Tiempo: ${loadTime}ms`;
    }
}

/**
 * Renderizar tabla de empleados
 */
function renderEmpleadosTable(empleados) {
    const tbody = document.getElementById('empleadosTable');

    if (!tbody) {
        console.error('Elemento empleadosTable no encontrado');
        return;
    }

    if (empleados.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          No hay empleados registrados
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = empleados.map(emp => `
    <tr>
      <td>${emp.idempleados}</td>
      <td><strong>${escapeHtml(emp.nombre)} ${escapeHtml(emp.apellido)}</strong></td>
      <td>${escapeHtml(emp.cargo || '-')}</td>
      <td>${escapeHtml(emp.email)}</td>
      <td>${escapeHtml(emp.dependencia || '-')}</td>
      <td>${escapeHtml(emp.nombre_jefe || '-')}</td>
    </tr>
  `).join('');
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Buscar empleados
 */
function searchEmpleados(query) {
    const tbody = document.getElementById('empleadosTable');
    const rows = tbody.getElementsByTagName('tr');

    query = query.toLowerCase();

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    }
}

/**
 * Ordenar tabla por columna
 */
function sortTable(columnIndex, ascending = true) {
    const tbody = document.getElementById('empleadosTable');
    const rows = Array.from(tbody.getElementsByTagName('tr'));

    rows.sort((a, b) => {
        const aValue = a.getElementsByTagName('td')[columnIndex]?.textContent || '';
        const bValue = b.getElementsByTagName('td')[columnIndex]?.textContent || '';

        return ascending ?
            aValue.localeCompare(bValue) :
            bValue.localeCompare(aValue);
    });

    // Re-insertar filas ordenadas
    rows.forEach(row => tbody.appendChild(row));
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadEmpleados();
    });
} else {
    loadEmpleados();
}