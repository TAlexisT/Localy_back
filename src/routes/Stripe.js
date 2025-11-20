import express from "express";
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
import Controlador_Stripe from "../Controllers/Stripe.js";
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorStripe = new Controlador_Stripe();
/**
 * {Fin de Sección: Inisialización}
 */

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  controladorStripe.webhookBase,
);

export default router;
