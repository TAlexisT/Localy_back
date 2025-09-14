var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const ControladorProductos = require("../Controllers/Productos");
const Productos_Middleware = require("../Middleware/Productos_Middleware");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorProductos = new ControladorProductos();
const productosMiddleware = new Productos_Middleware();
/**
 * {Fin de Sección: Inisialización}
 */

router.get("/obtener/:id", controladorProductos.obtenerProducto);

router.post(
  "/crear/:negocio_id",
  productosMiddleware.validarSesion,
  productosMiddleware.validarUsuarioNegocio,
  controladorProductos.crearProducto
);

router.put(
  "/actualizar/:negocio_id/:id",
  productosMiddleware.validarSesion,
  productosMiddleware.validarUsuarioNegocio,
  controladorProductos.actualizarProducto
);

router.delete(
  "/eliminar/:negocio_id/:id",
  productosMiddleware.validarSesion,
  productosMiddleware.validarUsuarioNegocio,
  controladorProductos.eliminarProducto
);
module.exports = router;
