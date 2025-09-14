const rateLimit = require("express-rate-limit");

class ProteccionServer {
  tasaMaxima = () => {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 15 minutos
      max: 200, // Limite de 100 peticiones por IP dentro del periodo de tiempo
      message:
        "Demasiadas peticiones desde esta IP, por favor intente de nuevo mas tarde.",
      standardHeaders: true, // Devuelve información de limitación en las cabeceras `RateLimit-*`
      legacyHeaders: false, // Deshabilita las cabeceras `X-RateLimit-*`
    });
  };
}

module.exports = new ProteccionServer();
