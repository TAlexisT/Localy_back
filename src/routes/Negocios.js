import express from "express";
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
import Controlador_Negocio from "../Controllers/Negocios.js";
import Negocios_Middleware from "../Middleware/Negocios_Middleware.js";
import ProteccionServer from "../Middleware/ProteccionServer.js";
import MiddlewaresGenerales from "../Middleware/MiddlewaresGenerales.js";
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorNegocio = new Controlador_Negocio();
const middlewareNegocio = new Negocios_Middleware();
const middlewaresGenerales = new MiddlewaresGenerales();
/**
 * {Fin de Sección: Inisialización}
 */

router.get(
  "/perfil/:id",
  middlewareNegocio.sesionUsuario,
  controladorNegocio.obtenerNegocio
);
router.get(
  "/obtener-cada-negocio",
  middlewaresGenerales.validarAdministrador,
  controladorNegocio.obtenerCadaNegocio
);
router.get(
  "/mostrar-facturacion-portal/:negocio_id",
  middlewareNegocio.validarSesion,
  middlewaresGenerales.validarUsuario,
  controladorNegocio.negocioFacturacionPortal
);

router.put(
  "/perfil/:negocio_id",
  middlewareNegocio.validarSesion,
  middlewaresGenerales.validarUsuario,
  middlewareNegocio.logoUpload.single("imagen"),
  controladorNegocio.actualizarPerfil
);

router.post("/mostrar", controladorNegocio.paginacionNegocios);
router.post("/crear-sesion-pago", controladorNegocio.negocioRegistro);
router.post(
  "/reactivar-sesion-pago/:negocio_id",
  middlewareNegocio.validarSesion,
  middlewareNegocio.validarRenovacion,
  controladorNegocio.negocioPriceRenovacion
);
router.post(
  "/subir-menu/:negocio_id",
  middlewareNegocio.validarSesion,
  middlewaresGenerales.validarUsuario,
  middlewareNegocio.menuUpload.single("imagen"),
  controladorNegocio.subirMenuImagen
);

router.delete(
  "/borrar-menu/:negocio_id/:menu_id",
  middlewareNegocio.validarSesion,
  middlewaresGenerales.validarUsuario,
  controladorNegocio.eliminarMenuImagen
);

router.use(ProteccionServer.multerError);

export default router;
