const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const robot = require("robotjs");
const os = require("os");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const crypto = require("crypto");

const app = express();
const PORT = 2000;
const MAX_DISPOSITIVOS = 20;
const RUTA_ARCHIVO = path.join(process.cwd(), "dispositivos.json");

//keyboard.config.autoDelayMs = 0;

// Permite peticiones desde la app móvil en la red local
app.use(cors());
app.use(express.json());

// --- PERSISTENCIA DE DISPOSITIVOS ---
// --- PERSISTENCIA DE DISPOSITIVOS ---
let dispositivos = [];

const guardarDispositivos = () => {
  try {
    fs.writeFileSync(
      RUTA_ARCHIVO,
      JSON.stringify(dispositivos, null, 2),
      "utf8",
    );
  } catch (err) {
    console.error("Error al guardar dispositivos.json:", err);
  }
};

// Cargar o crear el archivo al iniciar el servidor
if (!fs.existsSync(RUTA_ARCHIVO)) {
  // 1. Si NO existe, se crea automáticamente con un array vacío []
  guardarDispositivos();
  console.log("📝 Archivo dispositivos.json creado por primera vez.");
} else {
  // 2. Si SÍ existe, lo leemos de forma segura
  try {
    const data = fs.readFileSync(RUTA_ARCHIVO, "utf8").trim();
    // Si el archivo estaba completamente vacío, asignamos []
    dispositivos = data ? JSON.parse(data) : [];
  } catch (err) {
    console.error(
      "⚠️ Archivo dispositivos.json corrupto o inválido. Reiniciando a listado vacío:",
      err.message,
    );
    dispositivos = [];
    guardarDispositivos(); // Reescribe el archivo con [] válido para corregirlo
  }
}

// --- HELPER PARA OBTENER LA IP DE LA RED LOCAL ---
function obtenerIpLocal() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    // Ignorar la interfaz de Tailscale por nombre (común en Linux/macOS)
    if (name.toLowerCase().includes("tailscale")) continue;

    for (const iface of interfaces[name]) {
      if (
        iface.family === "IPv4" &&
        !iface.internal &&
        !iface.address.startsWith("100.") // Evita el rango Carrier-Grade NAT de Tailscale
      ) {
        return iface.address;
      }
    }
  }

  return "127.0.0.1";
}

// -----------------------------------------------------------------------------
// MIDDLEWARE GLOBAL DE AUTENTICACIÓN
// Valida la API Key en TODAS las rutas EXCEPTO en /api/test-conexion
// -----------------------------------------------------------------------------
app.use((req, res, next) => {
  // 1. Excepción: Permitir test de conexión sin API Key
  if (req.path === "/api/test" || req.path === "/vincular") {
    return next();
  }

  // 2. Extraer API Key (busca en Headers, Body o Query String)
  const apiKey =
    req.headers["x-api-key"] || req.body?.apiKey || req.query?.apiKey;

  // 3. Validar si la API Key fue enviada
  if (!apiKey) {
    return res.status(400).json({
      ok: false,
      mensaje: "Falta la API Key en la petición.",
    });
  }

  // 4. Validar existencia en la lista de dispositivos autorizados
  const existe = dispositivos.some((d) => d.apiKey === apiKey);
  if (!existe) {
    return res.status(401).json({
      ok: false,
      mensaje: "API Key no autorizada o no registrada.",
    });
  }

  // Si todo es correcto, pasa al controlador de la ruta
  next();
});

// -----------------------------------------------------------------------------
// RUTAS
// -----------------------------------------------------------------------------

// --- RUTA GET: Vincular Dispositivo (HTML + QR) ---
app.get("/vincular", async (req, res) => {
  const ipLocal = obtenerIpLocal();

  // Validar límite
  if (dispositivos.length >= MAX_DISPOSITIVOS) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Límite Alcanzado</title>
        <style>
          body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 16px; text-align: center; max-width: 320px; }
          h1 { color: #fb7185; font-size: 18px; margin: 0 0 8px 0; }
          p { color: #94a3b8; font-size: 13px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ Límite Alcanzado</h1>
          <p>Se alcanzó el máximo de ${MAX_DISPOSITIVOS} dispositivos vinculados.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Generar apiKey única
  const nuevaApiKey = crypto.randomUUID();
  dispositivos.push({
    apiKey: nuevaApiKey,
    creado: new Date().toISOString(),
  });

  guardarDispositivos();

  // Payload para la app Android
  const payload = JSON.stringify({
    ip: ipLocal,
    puerto: PORT,
    apiKey: nuevaApiKey,
  });

  try {
    const qrBase64 = await QRCode.toDataURL(payload, {
      width: 260,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vincular Dispositivo</title>
        <style>
          body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; text-align: center; width: 100%; max-width: 320px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          h1 { font-size: 18px; color: #818cf8; margin: 0 0 4px 0; }
          p { font-size: 12px; color: #94a3b8; margin: 0 0 16px 0; }
          .qr-box { background: #ffffff; padding: 12px; border-radius: 12px; display: inline-block; margin-bottom: 16px; }
          .qr-box img { display: block; width: 220px; height: 220px; }
          .info { background: #0f172a; padding: 10px; border-radius: 8px; border: 1px solid #334155; text-align: left; font-size: 11px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .info-row:last-child { margin-bottom: 0; }
          .ip { font-family: monospace; color: #34d399; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Vinculación de Dispositivo</h1>
          <p>Escaneá este código desde tu aplicación móvil</p>

          <div class="qr-box">
            <img src="${qrBase64}" alt="Código QR de Vinculación">
          </div>

          <div class="info">
            <div class="info-row">
              <span style="color:#94a3b8">Servidor:</span>
              <span class="ip">${ipLocal}:${PORT}</span>
            </div>
            <div class="info-row">
              <span style="color:#94a3b8">Dispositivos:</span>
              <span style="color:#818cf8; font-weight:bold">${dispositivos.length} / ${MAX_DISPOSITIVOS}</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error generando QR:", err);
    res.status(500).send("Error al generar el código QR");
  }
});

// 1. ENDPOINT GET: Test rápido de conectividad desde la App / Navegador
// --- ENDPOINT GET/POST: Test de Conectividad y Diagnóstico de API Key ---
app.all("/api/test", (req, res) => {
  // Buscar API Key opcional en Headers, Query o Body
  const apiKey =
    req.headers["x-api-key"] || req.query?.apiKey || req.body?.apiKey;

  // Caso 1: La petición no envió ninguna API Key (solo prueba de IP/Red)
  if (!apiKey) {
    return res.json({
      ok: true,
      conectado: true,
      vinculado: false,
      mensaje: "Servidor alcanzable. No se proporcionó API Key.",
      timestamp: new Date().toISOString(),
    });
  }

  // Caso 2: Se envió API Key y existe en la base de datos local
  const dispositivoValido = dispositivos.some((d) => d.apiKey === apiKey);

  if (dispositivoValido) {
    return res.json({
      ok: true,
      conectado: true,
      vinculado: true,
      mensaje: "Conexión exitosa y dispositivo vinculado correctamente.",
      timestamp: new Date().toISOString(),
    });
  }

  // Caso 3: Se envió API Key pero NO existe en el servidor (fue eliminada/reseteada)
  return res.status(200).json({
    ok: false,
    conectado: true,
    vinculado: false,
    requiereRevinculacion: true,
    mensaje:
      "Servidor alcanzable, pero el dispositivo no está vinculado. Debe escanear el QR nuevamente.",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/escanear", (req, res) => {
  const plataforma = os.platform();
  try {
    const { codigo, tipo } = req.body;

    if (!codigo || String(codigo).trim() === "") {
      return res.status(400).json({ ok: false, mensaje: "Código vacío" });
    }

    const codigoLimpio = String(codigo).trim();

    // 1. Responder INMEDIATAMENTE al cliente (< 10ms)
    res.json({ ok: true, codigo: codigoLimpio, plataforma });

    // 2. Ejecutar el tipeo nativo en segundo plano

    setImmediate(() => {
      if (plataforma === "win32") {
        try {
          robot.typeString(codigoLimpio);
          robot.keyTap("enter");

          console.log(
            `[USB EMULATOR ${plataforma}] ⌨️ Tipeado exitoso en ${plataforma}: ${codigoLimpio}`,
          );
        } catch (err) {
          console.error(
            `[USB EMULATOR ${plataforma}] ❌ Error en emulación de teclado:`,
            err,
          );
        }
      } else if (plataforma === "linux") {
        const command = `wtype "${codigoLimpio}" && wtype -k Return`;
        exec(command, (err) => {
          if (err) {
            console.error(
              `[USB EMULATOR ${plataforma}] ❌ Error enviando teclas en ${plataforma}:`,
              err,
            );
            return;
          }

          console.log(
            `[USB EMULATOR ${plataforma}] ⌨️ Tipeado exitoso en ${plataforma}: ${codigoLimpio}`,
          );
        });
      }
    });
  } catch (error) {
    console.error(`[USB EMULATOR ${plataforma}] ❌ Error interno:`, error);
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, mensaje: "Error de servidor" });
    }
  }
});

//plataforma === "linux"
// --- RUTA 1: Consultar datos del producto ---
app.post("/api/escanear/inventario", (req, res) => {
  const { codigo } = req.body;
  console.log(`[GET INVENTARIO] Consultando producto código: ${codigo}`);

  // Simulación de respuesta de Base de Datos
  if (codigo === "7791234567890") {
    return res.json({
      id: 1,
      codigo_barras: codigo,
      nombre: "producto de prueba",
      stockActual: 5,
      precio_costo_neto: 450.0,
      porcentaje_ganacia: 50.0,
    });
  } else {
    return res.json({
      id: 2,
      codigo_barras: codigo,
      nombre: "Producto de Prueba General",
      stockActual: 8,
      precio_costo_neto: 2500,
      porcentaje_ganacia: 50.0,
    });
  }
});

// --- RUTA 2: Actualizar/Ajustar Stock ---
app.post("/api/escanear/inventario/save", (req, res) => {
  const { codigo, operacion, cantidad, tipo } = req.body;

  console.log(`[POST INVENTARIO] Actualización recibida:`);
  console.log(
    `-> Código: ${codigo} | Acción: ${operacion.toUpperCase()} ${cantidad} (${tipo})`,
  );

  // Simulación de éxito
  return res.json({
    status: "success",
    mensaje: "Stock actualizado correctamente en base de datos local",
    timestamp: new Date(),
  });
});

app.listen(PORT, "0.0.0.0", () => {
  const ipLocal = obtenerIpLocal();
  console.log(`🚀 Servidor listo escuchando en http://0.0.0.0:${PORT}`);
  console.log(
    `📲 Para vincular la app abrí en el navegador: http://localhost:${PORT}/vincular`,
  );
  console.log(`💡 IP detectada en la red local: ${ipLocal}`);
});
