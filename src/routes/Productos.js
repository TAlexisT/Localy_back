var express = require("express");
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
const ControladorProductos = require("../Controllers/Productos");
const Productos_Middleware = require("../Middleware/Productos_Middleware");
const MiddlewaresGenerales = require("../Middleware/MiddlewaresGenerales");
const Proteccion_Server = require("../Middleware/ProteccionServer");
/**
 * {Fin de Sección: Llamada a clases subyacentes}
 */

/**
 * {Inicio de Sección: Inisialización}
 * Inicialización de las clases subyacentes, así como variables de control
 */
const controladorProductos = new ControladorProductos();
const productosMiddleware = new Productos_Middleware();
const middlewaresGenerales = new MiddlewaresGenerales();
/**
 * {Fin de Sección: Inisialización}
 */

router.get(
  "/obtener-producto/:id",
  productosMiddleware.sesionUsuario,
  controladorProductos.obtenerProducto
);
router.get(
  "/obtener-productos/:negocio_id",
  controladorProductos.obtenerProductosNegocio
);

router.post("/mostrar", controladorProductos.paginacionProductos);
router.post(
  "/crear/:negocio_id",
  productosMiddleware.validarSesion,
  middlewaresGenerales.validarUsuario,
  productosMiddleware.productoImagen.single("image"),
  controladorProductos.crearProducto
);

router.put(
  "/actualizar/:negocio_id/:id",
  productosMiddleware.validarSesion,
  middlewaresGenerales.validarUsuario,
  productosMiddleware.productoImagen.single("image"),
  controladorProductos.actualizarProducto
);

router.delete(
  "/eliminar/:negocio_id/:id",
  productosMiddleware.validarSesion,
  middlewaresGenerales.validarUsuario,
  controladorProductos.eliminarProducto
);

router.use(Proteccion_Server.multerError);

module.exports = router;
