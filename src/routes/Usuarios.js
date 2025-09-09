var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const Controlador_Usuario = require("../Controllers/Usuarios");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorUsuario = new Controlador_Usuario();
/**
 * {Fin de Sección: Inisialización}
 */

router.post("/registro", controladorUsuario.registro);
router.post("/login", controladorUsuario.login);
router.post("/logout", controladorUsuario.logout);

module.exports = router;
