var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Tramites_Pendientes = require("../Controllers/Tramites_Pendientes");
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

module.exports = router;
