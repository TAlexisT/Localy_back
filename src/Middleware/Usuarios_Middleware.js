const servs = require("../Services/ServiciosGenerales");

class Usuarios_Middleware {
  /**
   * Declaracion de variables secretas (privadas)
   */
  //...

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  //...

  validarSesion = async (req, res, next) => {
    const acceso = req.cookies.token_de_acceso;
    if (!acceso)
      return res.status(401).json({ exito: false, mensaje: "No autorizado." });
    const jwtExtraccion = servs.jwt_dataExtraction(acceso);
    if (!jwtExtraccion.exito) return res.status(401).json(jwtExtraccion);
    req.usuario = jwtExtraccion.datos;
    next();
  };
}

module.exports = Usuarios_Middleware;
