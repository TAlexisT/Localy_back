const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { corsConfigs } = require("./Configuraciones");

var usuariosRutas = require("./src/routes/Usuarios");
var negociosRutas = require("./src/routes/Negocios");
var productosRutas = require("./src/routes/Productos");
var tramitesRutas = require("./src/routes/Tramites");
var stripeRutas = require("./src/routes/Stripe");

const ProteccionServer = require("./src/Middleware/ProteccionServer");

const app = express();

/**
 * ¡¡Puerto en el cual se ejecutará el server!!
 */
const PORT = 3000;

/**
 * Middleware, por el cual pasarán las peticiones entrantes al servidor.
 */
app.use(cors(corsConfigs));
app.use(cookieParser());
app.use(ProteccionServer.tasaMaxima());
// app.use(express.static("public"));

/**
 * Prefijo para los correspondientes endpoints
 */
app.use("/api/stripe", stripeRutas);

// Como recordatorio, Stripe se comunicará a través de solicitudes "raw",
// por lo que el modificador json no debe aplicarse a las rutas de Stripe.
app.use(express.json());

app.use("/api/usuarios", usuariosRutas);
app.use("/api/negocios", negociosRutas);
app.use("/api/productos", productosRutas);
app.use("/api/tramites", tramitesRutas);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
