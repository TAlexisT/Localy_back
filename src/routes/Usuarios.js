var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Usuario = require("../Controllers/Usuarios");
const Usuarios_Middleware = require("../Middleware/Usuarios_Middleware");
const MiddlewaresGenerales = require("../Middleware/MiddlewaresGenerales");

/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorUsuario = new Controlador_Usuario();
const usuariosMiddleware = new Usuarios_Middleware();
const middlewaresGenerales = new MiddlewaresGenerales();
/**
 * {Fin de Sección: Inisialización}
 */

router.post("/registro", controladorUsuario.registro);
router.post("/login", controladorUsuario.login);
router.post("/logout", controladorUsuario.logout);
router.post(
  "/autenticar-sesion",
  usuariosMiddleware.validarSesion,
  controladorUsuario.autenticarSecion
);
router.post(
  "/autenticar-negocio/:negocio_id",
  usuariosMiddleware.validarSesion,
  middlewaresGenerales.validarUsuario,
  controladorUsuario.autenticarNegocio
);
router.post(
  "/favoritos/:usuario_id",
  usuariosMiddleware.validarSesion,
  usuariosMiddleware.validarUsuario,
  controladorUsuario.mostrarFavoritos
);
router.post(
  "/crear-favorito/:usuario_id",
  usuariosMiddleware.validarSesion,
  usuariosMiddleware.validarUsuario,
  controladorUsuario.crearFavorito
);

router.delete(
  "/borrar-favorito/:usuario_id/:favorito_id/:tipo",
  usuariosMiddleware.validarSesion,
  usuariosMiddleware.validarUsuario,
  controladorUsuario.borrarFavorito
);

router.get("/verificar-email", controladorUsuario.verificarEmail);

module.exports = router;
