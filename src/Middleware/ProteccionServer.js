const rateLimit = require("express-rate-limit");
const multer = require("multer");

class ProteccionServer {
  tasaMaxima = () => {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 300, // Limite de 300 peticiones por IP dentro del periodo de tiempo
      message: {
        exito: false,
        mensaje:
          "Demasiadas peticiones desde esta IP, por favor intente de nuevo mas tarde.",
      },
      standardHeaders: true, // Devuelve información de limitación en las cabeceras `RateLimit-*`
      legacyHeaders: false, // Deshabilita las cabeceras `X-RateLimit-*`
    });
  };

  multerError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res
          .status(400)
          .json({ exito: false, message: "Unexpected field in form data" });
      }
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ exito: false, message: "File too large" });
      }
    }
    res.status(500).json({ message: error.message });
  };
}

module.exports = new ProteccionServer();
