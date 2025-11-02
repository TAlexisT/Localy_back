import express from "express";
var router = express.Router();

/**
 * {Inicio de Sección: Llamada a clases subyacentes}
 *  Estas clases serán utilizadas por parte del midleware para procesar las peticiones entrantes
 */
import ControladorProductos from "../Controllers/Productos.js";
import Productos_Middleware from "../Middleware/Productos_Middleware.js";
import MiddlewaresGenerales from "../Middleware/MiddlewaresGenerales.js";
import Proteccion_Server from "../Middleware/ProteccionServer.js";
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

export default router;
