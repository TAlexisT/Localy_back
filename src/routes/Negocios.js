var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Negocio = require("../Controllers/Negocios");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorNegocio = new Controlador_Negocio();
/**
 * {Fin de Sección: Inisialización}
 */

router.get("/perfil/:id", controladorNegocio.obtenerNegocio);
router.get("/mostrar", controladorNegocio.paginacionNegocios);

router.put(
  "/perfil/:id",
  controladorNegocio.logoUpload.single("svg"),
  controladorNegocio.actualizarPerfil
);

router.post("/crear-sesion-pago", controladorNegocio.negocioRegistro);
router.post(
  "/reactivar-sesion-pago/:id",
  controladorNegocio.negocioPriceRenovacion
);

module.exports = router;
