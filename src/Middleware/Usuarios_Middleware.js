const servs = require("../Services/ServiciosGenerales");
const Negocios_Modelo = require("../db/Negocios");

class Usuarios_Middleware {
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
    const jwtExtraccion = servs.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    req.usuario = jwtExtraccion.datos;
    next();
  };

  validarUsuario = async (req, res, next) => {
    const { negocio_id } = req.params;
    if (!negocio_id)
      return res
        .status(400)
        .json({ exito: false, mensaje: "ID de negocio no proporcionado." });
    try {
      const negocio = await this.#modeloNegocio.negocioDeUsuario(
        req.usuario.id
      );
      if (negocio.empty || negocio.docs[0].id !== negocio_id)
        return res.status(403).json({
          exito: false,
          mensaje:
            "No tienes permisos para agregar o modificar productos a este negocio.",
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
}

module.exports = Usuarios_Middleware;
