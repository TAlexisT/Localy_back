import express from "express";
const router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
import Controlador_Usuario from "../Controllers/Usuarios.js";
import Usuarios_Middleware from "../Middleware/Usuarios_Middleware.js";
import MiddlewaresGenerales from "../Middleware/MiddlewaresGenerales.js";

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
  controladorUsuario.autenticarSecion,
);
router.post(
  "/autenticar-negocio/:negocio_id",
  usuariosMiddleware.validarSesion,
  middlewaresGenerales.validarUsuario,
  controladorUsuario.autenticarNegocio,
);
router.post(
  "/favoritos/:usuario_id",
  usuariosMiddleware.validarSesion,
  usuariosMiddleware.validarUsuario,
  controladorUsuario.mostrarFavoritos,
);
router.post(
  "/crear-favorito/:usuario_id",
  usuariosMiddleware.validarSesion,
  usuariosMiddleware.validarUsuario,
  controladorUsuario.crearFavorito,
);
router.post(
  "/peticion-cambiar-contrasena",
  controladorUsuario.peticionCambiarContrasena,
);
router.post("/cambiar-contrasena", controladorUsuario.cambiarContrasena);

router.delete(
  "/borrar-favorito/:usuario_id/:favorito_id/:tipo",
  usuariosMiddleware.validarSesion,
  usuariosMiddleware.validarUsuario,
  controladorUsuario.borrarFavorito,
);

router.get("/verificar-email", controladorUsuario.verificarEmail);

export default router;
