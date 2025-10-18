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
      return res.status(203).json({ exito: false, mensaje: "No autorizado." });
    const jwtExtraccion = servs.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    req.usuario = jwtExtraccion.datos;
    next();
  };

  validarUsuario = async (req, res, next) => {
    const { usuario_id } = req.params;
    if (req.usuario.id !== usuario_id)
      return res.status(203).json({
        exito: false,
        mensaje:
          "No estas autorizado a realizar actualizaciones o eliminaciones para este usuario",
      });

    next();
  };
}

module.exports = Usuarios_Middleware;
