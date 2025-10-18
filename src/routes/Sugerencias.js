var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Sugerencia = require("../Controllers/Sugerencias");
const Sugerencias_Middleware = require("../Middleware/Sugerencias_Middleware");
const MiddlewaresGenerales = require("../Middleware/MiddlewaresGenerales");

/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorSugerencias = new Controlador_Sugerencia();
const sugerenciasMiddleware = new Sugerencias_Middleware();
const middlewaresGenerales = new MiddlewaresGenerales();
/**
 * {Fin de Sección: Inisialización}
 */

router.post(
  "/crear-sugerencia/:negocio_id",
  sugerenciasMiddleware.validarSesion,
  middlewaresGenerales.validarUsuario,
  controladorSugerencias.crearSugerencia
);

router.delete(
  "/borrar-sugerencia/:sugerencia_id",
  middlewaresGenerales.validarAdministrador,
  controladorSugerencias.borrarSugerencia
);

router.get(
  "/obtener-toda-sugerencia",
  middlewaresGenerales.validarAdministrador,
  controladorSugerencias.mostrarCadaSugerencia
);
router.get(
  "/obtener-sugerencias/:negocio_id",
  sugerenciasMiddleware.validarSesion,
  middlewaresGenerales.validarUsuario,
  controladorSugerencias.mostrarSugerenciasNegocio
);

module.exports = router;
