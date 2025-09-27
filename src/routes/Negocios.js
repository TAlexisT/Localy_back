var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Negocio = require("../Controllers/Negocios");
const Negocios_Middleware = require("../Middleware/Negocios_Middleware");
const ProteccionServer = require("../Middleware/ProteccionServer");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorNegocio = new Controlador_Negocio();
const middlewareNegocio = new Negocios_Middleware();
/**
 * {Fin de Sección: Inisialización}
 */

router.get("/perfil/:id", controladorNegocio.obtenerNegocio);

router.put(
  "/perfil/:negocio_id",
  middlewareNegocio.validarSesion,
  middlewareNegocio.validarUsuario,
  middlewareNegocio.logoUpload.single("imagen"),
  controladorNegocio.actualizarPerfil
);

router.post("/mostrar", controladorNegocio.paginacionNegocios);
router.post("/crear-sesion-pago", controladorNegocio.negocioRegistro);
router.post(
  "/reactivar-sesion-pago/:negocio_id",
  middlewareNegocio.validarSesion,
  middlewareNegocio.validarUsuario,
  controladorNegocio.negocioPriceRenovacion
);



module.exports = router;
