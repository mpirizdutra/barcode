(function () {
  let timerInactividad;
  const TIEMPO_ESPERA = 180000; // 180000 ms equivalen a 3 minutos de inactividad

  // --- EXPOSICIÓN DE LA API PÚBLICA (Mover aquí arriba soluciona el error de carga) ---
  // Creamos un objeto global en 'window' inmediatamente para que esté disponible al instante en cualquier view
  window.AvianSync = {
    // Método para forzar la actualización de TODO ya mismo
    todo: async (forzar = false) => {
      if (timerInactividad) clearTimeout(timerInactividad);
      await ejecutarSincronizacionSilenciosa(null, forzar);
    },
    // Método para forzar una sola tabla por su key (ej: 'avian_productos')
    tabla: async (key, forzar = false) => {
      await ejecutarSincronizacionSilenciosa(key, forzar);
    }
  };

  // Configuración de tus tablas y endpoints
  const tablasASincronizar = [
    { key: 'avian_productos', endpoint: '/api/producto/lista-venta' },
    { key: 'avian_metodos_pago', endpoint: '/api/metodospago/lista-metodo' },
    { key: 'avian_promos', endpoint: '/api/producto/promociones' },
    { key: 'avian_clientes', endpoint: '/api/cliente/' },
    { key: 'avian_historial_ventas', endpoint: '/api/venta/historial' },
    { key: 'avian_recetas', endpoint: '/api/inventario/recetas' }
  ];

  function reiniciarTemporizador() {
    if (timerInactividad) {
      clearTimeout(timerInactividad);
    }
    timerInactividad = setTimeout(() => {
      // El timer por defecto intenta sincronizar TODO
      ejecutarSincronizacionSilenciosa();
    }, TIEMPO_ESPERA);
  }

  // Comprobación de seguridad para el carrito de compras
  function carritoTieneItems() {
    if (window.Alpine) {
      const elementoPOS = document.querySelector('[x-data="ventaPOS()"]');
      if (elementoPOS && elementoPOS.__x && elementoPOS.__x.$data) {
        const datosPOS = elementoPOS.__x.$data;
        if (datosPOS.carrito && datosPOS.carrito.length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Core de sincronización silenciosa
   * @param {String|null} tablaEspecificaKey - Si se pasa una key, solo sincroniza esa tabla. Si es null, sincroniza todas.
   * @param {Boolean} forzar - Si es true, ignora la validación del carrito.
   */
  async function ejecutarSincronizacionSilenciosa(
    tablaEspecificaKey = null,
    forzar = false
  ) {
    // 1. Si no se fuerza y el carrito tiene cosas, posponemos
    if (!forzar && carritoTieneItems()) {
      console.log(
        'POS activo con ítems en el carrito. Sincronización de fondo pospuesta.'
      );
      reiniciarTemporizador();
      return;
    }

    // 2. Verificamos Dexie
    if (!window.db) {
      console.log(
        'Dexie no está inicializado en esta vista. Se cancela la operación.'
      );
      if (!tablaEspecificaKey) reiniciarTemporizador();
      return;
    }

    // Filtramos si se pidió una sola tabla o vamos por todas
    const tablasAProcesar = tablaEspecificaKey
      ? tablasASincronizar.filter((t) => t.key === tablaEspecificaKey)
      : tablasASincronizar;

    if (tablasAProcesar.length === 0) {
      console.warn(
        `La tabla [${tablaEspecificaKey}] no existe en la configuración de sincronización.`
      );
      return;
    }

    console.log(
      `🤖 Iniciando sincronización manual/silenciosa de [${tablaEspecificaKey || 'Todas las tablas'}]...`
    );

    for (let t of tablasAProcesar) {
      if (!window.db[t.key]) continue;

      try {
        const response = await fetch(t.endpoint);
        if (!response.ok) throw new Error(`Status HTTP: ${response.status}`);

        const res = await response.json();
        const data = res.data || [];

        await window.db.transaction('rw', window.db[t.key], async () => {
          await window.db[t.key].clear();
          await window.db[t.key].bulkPut(data);
        });

        console.log(
          `✅ Tabla local [${t.key}] sincronizada con éxito. Registros: ${data.length}`
        );
      } catch (error) {
        console.error(`❌ Error al sincronizar la tabla [${t.key}]:`, error);
      }
    }

    // Solo si fue la sincronización automática de todas las tablas, reseteamos el timer global
    if (!tablaEspecificaKey) {
      reiniciarTemporizador();
    }
  }

  // Escuchamos las interacciones para el comportamiento automático de fondo
  const eventos = ['mousemove', 'keydown', 'click', 'touchstart'];
  eventos.forEach((evento) => {
    document.addEventListener(evento, reiniciarTemporizador);
  });

  // Arranca la cuenta regresiva inicial
  reiniciarTemporizador();
})();
