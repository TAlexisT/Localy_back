var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Restaurante = require("../Controllers/Restaurantes");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorRestaurante = new Controlador_Restaurante();
/**
 * {Fin de Sección: Inisialización}
 */

router.get("/perfil/:id", controladorRestaurante.obtenerNegocio);
router.get("/mostrar", controladorRestaurante.paginacionNegocios);
router.get("/perfil/:id/logo", controladorRestaurante.obtenerLogo);

router.put("/perfil/:id", controladorRestaurante.actualizarPerfil);

router.patch(
  "/perfil/:id/logo",
  controladorRestaurante.logoUpload.single("svg"),
  controladorRestaurante.actualizarLogo
);
router.post("/crear-sesion-pago", controladorRestaurante.negocioRegistro);
router.post(
  "/reactivar-sesion-pago/:id",
  controladorRestaurante.negocioPriceRenovacion
);

module.exports = router;
