var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Usuario = require("../Controllers/Usuarios");
const Usuarios_Middleware = require("../Middleware/Usuarios_Middleware");

/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorUsuario = new Controlador_Usuario();
const usuariosMiddleware = new Usuarios_Middleware();
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
  usuariosMiddleware.validarNegocioUsuario,
  controladorUsuario.autenticarNegocio
);

// Usamos los middleware correspondientes para los enpoints referentes a los favoritos del usuario
// Tamar precaucion puesto que se añadirán estos middleware a todos los endpoints añadidos abajo
router.use(usuariosMiddleware.validarSesion, usuariosMiddleware.validarUsuario);
router.delete(
  "/borrar-favorito/:usuario_id/:favorito_llave/:tipo",
  controladorUsuario.borrarFavorito
);

router.post("/crear-favorito/:usuario_id", controladorUsuario.crearFavorito);

router.get("/favoritos/:usuario_id", controladorUsuario.mostrarFavoritos);

module.exports = router;
