const servs = require("../Services/ServiciosGenerales");
const Negocios_Modelo = require("../db/Negocios");

class MiddlewaresGenerales {
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

  validarAdministrador = async (req, res, next) => {
    const acceso = req.cookies.token_de_acceso;
    if (!acceso)
      return res.status(401).json({ exito: false, mensaje: "No autorizado." });
    const jwtExtraccion = servs.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    if (jwtExtraccion.datos.tipo !== "admin")
      return res
        .status(403)
        .json({ exito: false, mensaje: "No puedes consultar estos datos" });
    req.usuario = jwtExtraccion.datos;
    next();
  };

  validarUsuario = async (req, res, next) => {
    try {
      const { negocio_id } = req.params;
      if (!negocio_id)
        return res
          .status(400)
          .json({ exito: false, mensaje: "ID de negocio no proporcionado." });

      const negocio = await this.#modeloNegocio.negocioDeUsuario(
        req.usuario.id
      );
      if (
        negocio.empty ||
        negocio.docs[0].id !== negocio_id ||
        (!negocio.docs[0].data().activo &&
          !req.originalUrl.includes("/obtener-sugerencias/"))
      )
        return res.status(403).json({
          exito: false,
          mensaje: negocio.empty
            ? "No fue encontrado ningun negocio vinculado a la sesion del usuario."
            : negocio.docs[0].id !== negocio_id
            ? "La sesion de usuario no es propietaria del negocio seleccionado (No tiene permisos de escritura)."
            : "El negocio especificado NO se encuentra activo. Contacta a soporte en caso de dudas.",
        });

      req.negocio_id = negocio_id;
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

module.exports = MiddlewaresGenerales;
