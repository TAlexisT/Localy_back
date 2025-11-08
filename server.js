import express, { json } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { corsConfigs } from "./Configuraciones.js";

import usuariosRutas from "./src/routes/Usuarios.js";
import negociosRutas from "./src/routes/Negocios.js";
import sugerenciasRutas from "./src/routes/Sugerencias.js";
import productosRutas from "./src/routes/Productos.js";
import tramitesRutas from "./src/routes/Tramites.js";
import stripeRutas from "./src/routes/Stripe.js";
import adminRutas from "./src/routes/Admin.js";

import proteccionServer from "./src/Middleware/ProteccionServer.js";
import SuscripcionJobs from "./src/jobs/GestionarSuscripcionJobs.js";

const suscripcionJobs = new SuscripcionJobs();
suscripcionJobs.init();

const app = express();

/**
 * ¡¡Puerto en el cual se ejecutará el server!!
 */
const PORT = process.env.PORT || 3000;

/**
 * Middleware, por el cual pasarán las peticiones entrantes al servidor.
 */
app.use(cors(corsConfigs));
app.use(cookieParser());
app.set('trust proxy', true);
app.use(proteccionServer.tasaMaxima());

/**
 * Prefijo para los correspondientes endpoints
 */
app.use("/api/stripe", stripeRutas);

// Como recordatorio, Stripe se comunicará a través de solicitudes "raw",
// por lo que el modificador json no debe aplicarse a las rutas de Stripe.
app.use(json());

app.use("/api/usuarios", usuariosRutas);
app.use("/api/negocios", negociosRutas);
app.use("/api/productos", productosRutas);
app.use("/api/tramites", tramitesRutas);
app.use("/api/sugerencias", sugerenciasRutas);
app.use("/api/admin", adminRutas);

// exports.api = functions.https.onRequest(app);
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
