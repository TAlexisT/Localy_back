import rateLimit from "express-rate-limit";
import multer from "multer";

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

  // ✅ Middleware de manejo de errores de Multer
  multerError = (error, req, res, next) => {
    if (error) {
      console.error("❌ Multer Error:", error);

      if (error instanceof multer.MulterError) {
        switch (error.code) {
          case "LIMIT_FILE_SIZE":
            return res.status(400).json({
              exito: false,
              mensaje: "El archivo es demasiado grande. Máximo 2MB.",
            });
          case "LIMIT_UNEXPECTED_FILE":
            return res.status(400).json({
              exito: false,
              mensaje: "Campo de archivo inesperado",
            });
          case "LIMIT_PART_COUNT":
            return res.status(400).json({
              exito: false,
              mensaje: "Demasiadas partes en el formulario",
            });
          case "LIMIT_FIELD_KEY":
            return res.status(400).json({
              exito: false,
              mensaje: "Nombre de campo demasiado largo",
            });
          default:
            return res.status(400).json({
              exito: false,
              mensaje: `Error al procesar el archivo: ${error.code} `,
            });
        }
      }

      // Para errores personalizados del fileFilter
      return res.status(400).json({
        exito: false,
        mensaje: "Error en el servidor",
      });
    }
    next();
  };
}

export default new ProteccionServer();
