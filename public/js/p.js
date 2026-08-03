<div class="p-4 lg:p-6 max-w-[1600px] mx-auto" x-data="ventaPOS()" @keydown.f10.window.prevent="if(puedeFinalizar()) procesarVenta()" @keydown.f2.window.prevent="abrirModalCliente()" @keydown.f4.window.prevent="modalPromo = true" >

    <div class="grid grid-cols-12 gap-5">

        <div class="col-span-12 lg:col-span-8 space-y-4">
            <div class="relative" @click.away="searchResult = []">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span class="material-symbols-outlined text-avian-muted">search</span>
            </div>
            <input type="text" x-model="query" @input.debounce.300ms="buscarProducto()" class="w-full h-14 pl-12 pr-4 bg-white border border-avian-border rounded-2xl shadow-sm focus:ring-2 focus:ring-avian-primary/20 focus:border-avian-primary outline-none text-lg transition-all" placeholder="Buscar producto o escanear código (F1)...">

            <div x-show="searchResult.length > 0" class="absolute w-full mt-2 bg-white border border-avian-border rounded-2xl shadow-xl z-50 overflow-hidden">
                <template x-for="p in searchResult" :key="p.id">
                <div @click="agregarAlCarrito(p)" class="p-4 hover:bg-avian-primary-light cursor-pointer flex justify-between items-center border-b border-avian-border last:border-0 transition-colors">
                <div>
                    <div class="font-bold text-avian-text" x-text="p.nombre"></div>
                    <div class="text-sm text-avian-muted" x-text="'$ ' + p.precio.toFixed(2)"></div>
                </div>
                <span class="material-symbols-outlined text-avian-primary">add_circle</span>
            </div>
        </template>
    </div>
      </div >

      <div class="bg-white border border-avian-border rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <div class="px-6 py-3 border-b border-avian-border flex justify-between items-center bg-slate-50/50">
          <div class="flex items-center gap-4">
            <h3 class="font-bold text-avian-text text-sm">Artículos en Venta</h3>
            <button @click="modalPromo = true" class="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black hover:bg-amber-200 transition-colors uppercase tracking-wider">
              <span class="material-symbols-outlined text-sm">auto_awesome</span>
              Promos / Combos (F4)
            </button>
          </div>
          <span class="text-[10px] font-black text-avian-muted uppercase tracking-widest" x-text="carrito.length + ' Ítems'"></span>
        </div>

        <div class="flex-grow overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50/80 border-b border-avian-border">
              <tr>
                <th class="text-left px-6 py-3 text-[10px] font-black text-avian-muted uppercase">Descripción</th>
                <th class="text-center px-6 py-3 text-[10px] font-black text-avian-muted uppercase">Cant / Kilos</th>
                <th class="text-right px-6 py-3 text-[10px] font-black text-avian-muted uppercase">Unitario</th>
                <th class="text-right px-6 py-3 text-[10px] font-black text-avian-muted uppercase">Subtotal</th>
                <th class="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-avian-border">
              <template x-for="(item, index) in carrito" :key="index">
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4 font-bold text-avian-text text-sm" x-text="item.nombre"></td>
                  <td class="px-6 py-4 text-center">
                    <input type="number" x-model="item.cantidad" @input="calcularTotal()" class="w-16 h-8 text-center border border-avian-border rounded-lg font-bold outline-none focus:border-avian-primary">
                  </td>
                  <td class="px-6 py-4 text-right text-sm text-avian-muted" x-text="'$ ' + item.precio.toFixed(2)"></td>
                  <td class="px-6 py-4 text-right font-bold text-avian-text text-sm" x-text="'$ ' + (item.precio * item.cantidad).toFixed(2)"></td>
                  <td class="px-6 py-4 text-center">
                    <button @click="quitarDelCarrito(index)" class="text-avian-danger hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table >

    <div x-show="carrito.length === 0" class="flex flex-col items-center justify-center py-20 opacity-40">
        <span class="material-symbols-outlined text-6xl mb-2 text-avian-muted">shopping_basket</span>
        <p class="font-bold text-avian-muted">Carrito vacío</p>
    </div>
        </div >
      </div >
    </div >

    <div class="col-span-12 lg:col-span-4">
        <div class="bg-white border border-avian-border rounded-2xl shadow-lg p-5 sticky top-[80px]">

            <div class="mb-5">
                <div class="flex justify-between items-center mb-1.5">
                    <label class="text-[10px] font-black text-avian-muted uppercase tracking-wider">Cliente</label>
                    <button @click="abrirModalCliente()" class="text-[11px] font-bold text-avian-primary hover:bg-avian-primary-light px-2 py-0.5 rounded-md transition-colors">CAMBIAR (F2)</button>
            </div>
            <div class="flex items-center p-2.5 bg-avian-bg border border-avian-border rounded-xl">
                <span class="material-symbols-outlined text-avian-primary mr-2.5 text-xl">person</span>
                <span class="font-bold text-avian-text text-sm" x-text="cliente.nombre">Consumidor Final</span>
            </div>
        </div>

        <div class="mb-5">
            <label class="text-[10px] font-black text-avian-muted uppercase mb-2 block tracking-wider">Método de Pago</label>
            <div class="grid grid-cols-2 gap-3">
                <template x-for="metodo in [{v:'efectivo', n:'Efectivo', i:'payments'}, {v:'debito', n:'Débito', i:'credit_card'}, {v:'qr', n:'QR', i:'qr_code_2'}, {v:'transferencia', n:'Transf.', i:'sync_alt'}]">
                    <label class="relative cursor-pointer group">
                        <input type="radio" name="pay_method" :value="metodo.v" x-model="pago" class="peer sr-only">
                        <div class="p-3 flex flex-col items-center justify-center border border-avian-border rounded-xl transition-all 
                              peer-checked:bg-avian-primary peer-checked:text-white peer-checked:border-avian-primary 
                              peer-checked:shadow-md hover:bg-slate-50">
                            <span class="material-symbols-outlined text-2xl mb-1" x-text="metodo.i"></span>
                            <span class="text-[11px] font-bold uppercase tracking-tight" x-text="metodo.n"></span>
                        </div>
                    </label>
                </template>
            </div>
        </div>

        <div class="mb-5 p-3 border border-dashed border-avian-border rounded-xl bg-slate-50/50">
            <div class="flex justify-between items-center mb-2">
                <label class="text-[10px] font-black text-avian-muted uppercase">Descuento Manual</label>
                <span class="text-[10px] font-bold text-avian-primary" x-show="descuento > 0" x-text="'- $ ' + descuento"></span>
            </div>
            <div class="relative mb-2">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-avian-muted text-xs">$</span>
                <input type="number" x-model.number="descuento" @input="calcularTotal()" class="w-full pl-6 pr-3 py-2 bg-white border border-avian-border rounded-lg text-sm font-bold outline-none focus:border-avian-primary" placeholder="0.00">
            </div>
            <div x-show="descuento > 0" x-transition class="space-y-1">
                <label class="text-[9px] font-bold text-avian-danger uppercase">Motivo obligatorio</label>
                <input type="text" x-model="motivoDescuento" :class="descuento > 0 && motivoDescuento.length < 3 ? 'border-avian-danger' : 'border-avian-border'" class="w-full p-2 text-[11px] bg-white border rounded-lg outline-none focus:ring-1 focus:ring-avian-danger" placeholder="Ej: Atención al cliente, Combo manual...">
            </div>
        </div>

        <div class="bg-[#1e293b] rounded-2xl p-5 text-center mb-5 shadow-inner">
            <span class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Total a Cobrar</span>
            <div class="text-4xl font-mono font-black text-avian-success mt-1 tracking-tighter" x-text="'$ ' + total.toFixed(2)"></div>
        </div>

        <button @click="procesarVenta()" :disabled="!puedeFinalizar()" :class="!puedeFinalizar() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-avian-primary-dark active:scale-[0.97]'" class="w-full py-4 bg-avian-primary text-white font-black rounded-xl shadow-lg shadow-avian-primary/30 transition-all text-sm tracking-widest uppercase">
        PROCESAR VENTA (F10)
    </button>
      </div >
    </div >
  </div >

  <div x-show="modalCliente" class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" x-transition.opacity>
    <div @click.away="modalCliente = false" class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
      <div class="p-5 border-b border-avian-border flex justify-between items-center bg-slate-50">
        <h3 class="font-black text-avian-text uppercase text-sm tracking-tight">Seleccionar Cliente</h3>
        <button @click="modalCliente = false" class="text-avian-muted hover:text-avian-danger"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="p-5">
        <input type="text" placeholder="Buscar por nombre o DNI..." class="w-full p-3 bg-avian-bg border border-avian-border rounded-xl outline-none focus:border-avian-primary mb-4">
        <div class="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          <template x-for="c in listaClientes" :key="c.id">
            <div @click="seleccionarCliente(c)" class="p-4 rounded-2xl border border-transparent hover:border-avian-primary hover:bg-avian-primary-light cursor-pointer transition-all group">
              <div class="font-bold text-avian-text group-hover:text-avian-primary" x-text="c.nombre"></div>
              <div class="text-xs text-avian-muted" x-text="'DNI: ' + c.dni"></div>
            </div>
          </template>
        </div>
      </div >
    </div >
  </div >

  <div x-show="modalPromo" class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" x-transition.opacity>
    <div @click.away="modalPromo = false" class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
      <div class="p-5 border-b border-avian-border flex justify-between items-center bg-amber-50">
        <h3 class="font-black text-amber-800 uppercase text-sm flex items-center gap-2">
          <span class="material-symbols-outlined">auto_awesome</span> Promociones y Combos
        </h3>
        <button @click="modalPromo = false" class="text-avian-muted hover:text-avian-danger"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="p-6 grid grid-cols-1 gap-3">
        <template x-for="promo in promosDisponibles" :key="promo.id">
          <button @click="agregarAlCarrito(promo, true)" class="flex justify-between items-center p-4 border border-avian-border rounded-2xl hover:border-avian-primary hover:bg-avian-primary-light transition-all text-left group">
            <div>
              <div class="font-bold text-avian-text group-hover:text-avian-primary" x-text="promo.nombre"></div>
              <div class="text-xs text-avian-muted" x-text="promo.descripcion"></div>
            </div>
            <div class="text-right">
              <div class="text-lg font-black text-avian-primary" x-text="'$ ' + promo.precio"></div>
              <span class="text-[9px] font-bold text-white bg-avian-success px-2 py-0.5 rounded-full uppercase">Aplicar</span>
            </div>
          </button>
        </template >
      </div >
    </div >
  </div >

</div >

    <script>
        function ventaPOS() {
    return {
            query: '',
        searchResult: [],
        carrito: [],
        total: 0,
        pago: 'efectivo',
        modalCliente: false,
        cliente: {
            nombre: 'Consumidor Final',
        dni: '00000000'
      },
        listaClientes: [{
            id: 1,
        nombre: 'Consumidor Final',
        dni: '00000000'
        },
        {
            id: 2,
        nombre: 'Juan Pérez',
        dni: '20444555'
        },
        {
            id: 3,
        nombre: 'María García',
        dni: '30111222'
        }
        ],

        buscarProducto() {
        // Simulación de búsqueda
        if (this.query.length > 1) {
            this.searchResult = [{
                id: 101,
                nombre: 'Leche Descremada 1L',
                precio: 180.00
            },
            {
                id: 102,
                nombre: 'Banana Cavendish',
                precio: 950.00
            }
            ];
        } else {
            this.searchResult = [];
        }
      },

        agregarAlCarrito(p) {
        const existe = this.carrito.find(item => item.id === p.id);
        if (existe) {
            existe.cantidad++;
        } else {
            this.carrito.push({
                ...p,
                cantidad: 1
            });
        }
        this.searchResult = [];
        this.query = '';
        this.calcularTotal();
      },

        quitarDelCarrito(index) {
            this.carrito.splice(index, 1);
        this.calcularTotal();
      },

        calcularTotal() {
            this.total = this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      },

        abrirModalCliente() {
            this.modalCliente = true;
      },

        seleccionarCliente(c) {
            this.cliente = c;
        this.modalCliente = false;
      },

        procesarVenta() {
        if (this.carrito.length === 0) return;
        alert('Procesando venta de: $ ' + this.total);
        // Aquí iría tu fetch al backend
      }
    }
  }
    </script>