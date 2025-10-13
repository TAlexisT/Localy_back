var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Sugerencia = require("../Controllers/Sugerencias");
const Sugerencias_Middleware = require("../Middleware/Sugerencias_Middleware");

/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorSugerencias = new Controlador_Sugerencia();
const sugerenciasMiddleware = new Sugerencias_Middleware();
/**
 * {Fin de Sección: Inisialización}
 */

router.post(
  "/crear-sugerencia/:negocio_id",
  sugerenciasMiddleware.validarSesion,
  sugerenciasMiddleware.validarUsuarioNegocio,
  controladorSugerencias.crearSugerencia
);

router.get(
  "/obtener-toda-sugerencias",
  sugerenciasMiddleware.validarAdministrador,
  controladorSugerencias.mostrarCadaSugerencia
);
router.get(
  "/obtener-sugerencias/:negocio_id",
  sugerenciasMiddleware.validarSesion,
  sugerenciasMiddleware.validarUsuarioNegocio,
  controladorSugerencias.mostrarSugerenciasNegocio
);

module.exports = router;
