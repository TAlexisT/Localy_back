const servs = require("../Services/ServiciosGenerales");

class MiddlewaresGenerales {
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
}

module.exports = MiddlewaresGenerales;
