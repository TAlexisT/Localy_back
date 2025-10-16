var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const MiddlewaresGenerales = require("../Middleware/MiddlewaresGenerales");
const Controlador_Admin = require("../Controllers/Admin");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorAdmin = new Controlador_Admin();
const middlewaresGenerales = new MiddlewaresGenerales();
/**
 * {Fin de Sección: Inisialización}
 */

router.get(
  "/disparar-subscripcion-jobs",
  middlewaresGenerales.validarAdministrador,
  controladorAdmin.dispararSubscripcionJobs
);

module.exports = router;
