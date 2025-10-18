const Negocios_Modelo = require("../db/Negocios");
const multer = require("multer");

const servs = require("../Services/ServiciosGenerales");

class Negocios_Middleware {
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
      return res.status(401).json({ exito: false, mensaje: "No autenticado" });

    const jwtExtraccion = servs.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    req.usuario = jwtExtraccion.datos;
    next();
  };

  validarRenovacion = async (req, res, next) => {
    const { negocio_id } = req.params;
    if (!negocio_id)
      return res
        .status(400)
        .json({ exito: false, mensaje: "ID de negocio no proporcionado." });
    try {
      const negocio = await this.#modeloNegocio.negocioDeUsuario(
        req.usuario.id
      );
      if (
        negocio.empty ||
        negocio.docs[0].id !== negocio_id ||
        negocio.docs[0].data().activo
      )
        return res.status(negocio.empty ? 404 : 403).json({
          exito: false,
          mensaje: negocio.empty
            ? "No fue encontrado ningun negocio vinculado a la sesion del usuario."
            : negocio.docs[0].id !== negocio_id
            ? "La sesion de usuario no es propietaria del negocio seleccionado."
            : "El negocio especificado ya se encuentra activo. Contacta a soporte en caso de dudas.",
        });
      next();
    } catch (err) {
      console.error("Error en Middleware de validación de negocio:", err);
      return res.status(500).json({
        exito: false,
        mensaje: "Error del servidor.",
      });
    }
  };

  sesionUsuario = async (req, res, next) => {
    const acceso = req.cookies.token_de_acceso;
    if (!acceso) return next();

    const jwtExtraccion = servs.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    req.usuario = jwtExtraccion.datos;
    next();
  };

  logoUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPG, PNG and SVG files are allowed"), false);
      }
    },
  });

  menuUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPG, PNG files are allowed"), false);
      }
    },
  });
}

module.exports = Negocios_Middleware;
