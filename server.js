require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const os = require("os");
const path = require("path");
const fs = require("fs");

/**
 * ¡¡Puerto en el cual se ejecutará el server!!
 */
const PORT = 3000;

app.use(cors());
app.use(express.static("public"));

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Usuario = require("./src/Controllers/Usuarios");
const Controlador_Restaurante = require("./src/Controllers/Restaurantes");
const Controlador_Stripe = require("./src/Controllers/stripe");
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
// Fin de Subsección: Usuario

// Inicio de Subsección: Restaurante
app.post(
  "/api/restaurante/crear-sesion-pago",
  controladorRestaurante.negocioRegistro
);
app.put("/api/restaurante/perfil/:id", controladorRestaurante.actualizarPerfil);

app.get(
  "/api/restaurante/perfil/:id",
  controladorRestaurante.obtenerRestaurante
);
app.get(
  "/api/restaurante/mostrar",
  controladorRestaurante.paginacionRestaurantes
);
// Fin de Subsección: Restaurante

/**
 * Fin de Sección: Enrutamiento
 */

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
