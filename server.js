require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { corsConfigs } = require("./Configuraciones");

const app = express();

/**
 * ¡¡Puerto en el cual se ejecutará el server!!
 */
const PORT = 3000;

app.use(cors(corsConfigs));
app.use(cookieParser());
app.use(express.static("public"));

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Usuario = require("./src/Controllers/Usuarios");
const Controlador_Restaurante = require("./src/Controllers/Restaurantes");
const Controlador_Stripe = require("./src/Controllers/Stripe");
const Controlador_Tramites_Pendientes = require("./src/Controllers/Tramites_Pendientes");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorUsuario = new Controlador_Usuario();
const controladorRestaurante = new Controlador_Restaurante();
const controladorStripe = new Controlador_Stripe();
const controladorTramitesPendientes = new Controlador_Tramites_Pendientes();
/**
 * {Fin de Sección: Inisialización}
 */

/**
 * Inicio de Sección: Enrutamiento
 * Aquí se definen las rutas de acceso a los diferentes puntos finales (Interacción con el API)
 */

// Inicio de Subsección: Stripe
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  controladorStripe.webhookBase
);
// Fin de Subsección: Stripe

/**
 * Clausula importante para poder usar "JSON" en todos los puntos finales correspondientes a interacciones con usuarios de esta API
 */
app.use(bodyParser.json()); // No colocar antes de la subsección "Stripe"

// Inicio de Subsección: Usuario
app.post("/api/usuario/registro", controladorUsuario.registro);
app.post("/api/usuario/login", controladorUsuario.login);
app.post("/api/usuario/logout", controladorUsuario.logout);
// Fin de Subsección: Usuario

// Inicio de Subsección: Restaurante
app.get(
  "/api/restaurante/perfil/:id",
  controladorRestaurante.obtenerRestaurante
);
app.get(
  "/api/restaurante/mostrar",
  controladorRestaurante.paginacionRestaurantes
);
app.get(
  "/api/restaurantes/perfil/:id/logo",
  controladorRestaurante.obtenerLogo
);

app.put("/api/restaurante/perfil/:id", controladorRestaurante.actualizarPerfil);

app.patch(
  "/api/restaurante/perfil/:id/logo",
  controladorRestaurante.logoUpload.single("svg"),
  controladorRestaurante.actualizarLogo
);
app.post(
  "/api/restaurante/crear-sesion-pago",
  controladorRestaurante.negocioRegistro
);
app.post(
  "/api/restaurante/perfil/reactivar-sesion-pago/:id",
  controladorRestaurante.negocioRenovacion
);
// Fin de Subsección: Restaurante

// Inicio de Subsección: Tramites Pendientes
app.get(
  "/api/tramite-pendiente/:id",
  controladorTramitesPendientes.obtenerTramite
);
// Fin de Subsección: Tramites Pendientes

/**
 * Fin de Sección: Enrutamiento
 */

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
