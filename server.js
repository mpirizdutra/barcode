const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const PORT = 3000;

// Permite peticiones desde la app móvil en la red local
app.use(cors());
app.use(express.json());

// Endpoint para recibir y mostrar el código en la consola de la PC
app.post('/api/escanear', (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo || String(codigo).trim() === '') {
      return res.status(400).json({ ok: false, mensaje: 'Código vacío' });
    }

    const codigoLimpio = String(codigo).trim();

    // SendKeys de Windows: el caracter ~ significa presionar ENTER
    const command = `powershell -c "$w = New-Object -ComObject wscript.shell; $w.SendKeys('${codigoLimpio}~')"`;

    exec(command, (err) => {
      if (err) {
        console.error('[USB EMULATOR] ❌ Error enviando teclas:', err);
        return res.status(500).json({ ok: false, mensaje: 'Error al escribir en PC' });
      }

      console.log(`[USB EMULATOR] ⌨️ Tipeado exitoso en Windows: ${codigoLimpio}`);
      return res.json({ ok: true, codigo: codigoLimpio });
    });

  } catch (error) {
    console.error('[USB EMULATOR] ❌ Error interno:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error de servidor' });
  }
  /* const { codigo, tipo } = req.body;
 
   console.log('------------------------------------');
   console.log(`📦 ¡CÓDIGO RECIBIDO DESDE LA APP!`);
   console.log(`👉 Código: ${codigo}`);
   console.log(`👉 Tipo/Origen: ${tipo || 'No especificado'}`);
   console.log(`⏰ Hora: ${new Date().toLocaleTimeString()}`);
   console.log('------------------------------------');*/

  // Responder a la app que todo salió bien
  // res.json({ ok: true, mensaje: 'Código recibido correctamente en PC' });
});


// --- RUTA 1: Consultar datos del producto ---
app.post('/api/escanear/inventario', (req, res) => {
  const { codigo } = req.body;
  console.log(`[GET INVENTARIO] Consultando producto código: ${codigo}`);

  // Simulación de respuesta de Base de Datos
  if (codigo === '7791234567890') {
    return res.json({
      id: 1,
      codigo: codigo,
      nombre: 'Aceite de Girasol 1L',
      stockActual: 15,
      precioCosto: 1200,
      tipo: 'unidad'
    });
  } else {
    return res.json({
      id: 2,
      codigo: codigo,
      nombre: 'Producto de Prueba General',
      stockActual: 8.5,
      precioCosto: 2500,
      tipo: 'kilos'
    });
  }
});

// --- RUTA 2: Actualizar/Ajustar Stock ---
app.post('/api/escanear/inventario/save', (req, res) => {
  const { codigo, operacion, cantidad, tipo } = req.body;

  console.log(`[POST INVENTARIO] Actualización recibida:`);
  console.log(`-> Código: ${codigo} | Acción: ${operacion.toUpperCase()} ${cantidad} (${tipo})`);

  // Simulación de éxito
  return res.json({
    status: 'success',
    mensaje: 'Stock actualizado correctamente en base de datos local',
    timestamp: new Date()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor listo escuchando en http://0.0.0.0:${PORT}`);
  console.log(`💡 Usa la IP local de tu PC en la App.`);
});