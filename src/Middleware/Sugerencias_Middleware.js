import Negocios_Modelo from "../db/Negocios.js";

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
}

export default Productos_Middleware;
