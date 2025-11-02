import express from "express";
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
import Controlador_Tramites_Pendientes from "../Controllers/Tramites_Pendientes.js";
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorTramitesPendientes = new Controlador_Tramites_Pendientes();
/**
 * {Fin de Sección: Inisialización}
 */

router.get("/:id", controladorTramitesPendientes.obtenerTramite);

export default router;
