document.addEventListener('alpine:init', () => {
    Alpine.data('posPrueba', () => ({
        // Variables para el escáner global
        bufferScanner: '',
        ultimoTiempoTeclado: Date.now(),
        busquedaManual: '',
        // Variables de estado de la UI
        ultimoCodigo: '',
        productoEncontrado: null,
        cargando: false,

        init() {
            // Escuchar CUALQUIER tecla en la pantalla
            window.addEventListener('keydown', (e) => this.capturarEntradaScanner(e));
        },

        capturarEntradaScanner(e) {
            const ahora = Date.now();
            const tiempoDiferencia = ahora - this.ultimoTiempoTeclado;
            this.ultimoTiempoTeclado = ahora;

            // 1. Si el intervalo entre teclas es mayor a 80ms, consideramos que es un humano tipeando manual.
            if (tiempoDiferencia > 80) {
                this.bufferScanner = '';
            }

            // 2. Si llega un Enter, procesamos el buffer acumulado
            if (e.key === 'Enter') {
                if (this.bufferScanner.length >= 3) {
                    e.preventDefault(); // Evita envíos de formularios por defecto

                    const codigoDetectado = this.bufferScanner;
                    this.bufferScanner = ''; // Limpiamos buffer
                    // 🧹 LIMPIEZA DEL INPUT: Si había un <input> activo o enfocado con texto, lo vaciamos
                    this.limpiarInputBusqueda();
                    // Disparar simulación
                    this.procesarEscaneo(codigoDetectado);
                }
                return;
            }

            // 3. Si es una tecla imprimible (números, letras), la sumamos al buffer
            if (e.key.length === 1) {
                this.bufferScanner += e.key;
            }
        },
        limpiarInputBusqueda() {
            // A) Limpiar la propiedad de Alpine (si usás x-model)
            this.busquedaManual = '';

            // B) Limpiar el elemento HTML activo si es un input text o textarea
            const elementoActivo = document.activeElement;
            if (elementoActivo && (elementoActivo.tagName === 'INPUT' || elementoActivo.tagName === 'TEXTAREA')) {
                elementoActivo.value = '';
            }
        },

        async procesarEscaneo(codigo) {
            this.ultimoCodigo = codigo;
            this.cargando = true;
            this.productoEncontrado = null;

            console.log(`[POS-FRONTEND] 📦 Código capturado globalmente: ${codigo}`);

            // Simular petición a API (delay de 400ms para hacer de cuenta que busca en BBDD)
            await new Promise(resolve => setTimeout(resolve, 400));

            // Simular respuesta de producto
            this.productoEncontrado = {
                codigo: codigo,
                nombre: `Producto de Prueba (${codigo.slice(-4)})`,
                precio: (Math.random() * 50 + 10).toFixed(2)
            };

            this.cargando = false;
        }
    }));
});