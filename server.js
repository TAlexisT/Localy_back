import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { corsConfigs, port, host, entorno } from "./Configuraciones.js";

import usuariosRutas from "./src/routes/Usuarios.js";
import negociosRutas from "./src/routes/Negocios.js";
import sugerenciasRutas from "./src/routes/Sugerencias.js";
import productosRutas from "./src/routes/Productos.js";
import tramitesRutas from "./src/routes/Tramites.js";
import stripeRutas from "./src/routes/Stripe.js";
import adminRutas from "./src/routes/Admin.js";

import proteccionServer from "./src/Middleware/ProteccionServer.js";
import SuscripcionJobs from "./src/jobs/GestionarJobs.js";

const app = express();

/**
 * Middleware, por el cual pasarán las peticiones entrantes al servidor.
 */
if (entorno === "produccion") {
  app.set("trust proxy", 2);
  app.use(proteccionServer.tasaMaxima()); // Limitar a 100 peticiones cada 5 minutos
}
app.use(cors(corsConfigs));
app.use(cookieParser());

app.use("/api/stripe", stripeRutas);

/**
 * Prefijo para los correspondientes endpoints
 */

// Como recordatorio, Stripe se comunicará a través de solicitudes "raw",
// por lo que el modificador json no debe aplicarse a las rutas de Stripe.
app.use(json());

app.use("/api/usuarios", usuariosRutas);
app.use("/api/negocios", negociosRutas);
app.use("/api/productos", productosRutas);
app.use("/api/tramites", tramitesRutas);
app.use("/api/sugerencias", sugerenciasRutas);
app.use("/api/admin", adminRutas);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.listen(port, host, () => {
  console.log(`Servidor escuchando en http://${host}:${port}`);

  const suscripcionJobs = new SuscripcionJobs();
  suscripcionJobs.init();
});
