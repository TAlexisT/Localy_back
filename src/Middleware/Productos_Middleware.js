import Negocios_Modelo from "../db/Negocios.js";
import multer, { memoryStorage } from "multer";

import ServiciosGenerales from "../Services/ServiciosGenerales.js";

class Productos_Middleware {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloNegocio;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloNegocio = new Negocios_Modelo();
  }

  validarSesion = async (req, res, next) => {
    const acceso = req.cookies.token_de_acceso;
    if (!acceso)
      return res.status(401).json({ exito: false, mensaje: "No autorizado." });
    const jwtExtraccion = ServiciosGenerales.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    req.usuario = jwtExtraccion.datos;
    next();
  };

  sesionUsuario = async (req, res, next) => {
    const acceso = req.cookies.token_de_acceso;
    if (!acceso) return next();

    const jwtExtraccion = ServiciosGenerales.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    req.usuario = jwtExtraccion.datos;
    next();
  };

  productoImagen = multer({
    storage: memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024, // 2 MB
    },
    fileFilter: (req, file, cb) => {
      // Aceptar solo imágenes
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed!"), false);
      }
    },
  });
}

export default Productos_Middleware;
