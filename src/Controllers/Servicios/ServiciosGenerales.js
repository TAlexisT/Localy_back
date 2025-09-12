const jwt = require("jsonwebtoken");

const { jwtSecreta } = require("../../../Configuraciones");
const { string } = require("joi");

class ServiciosGenerales {
  static jwt_accessToken(datos = {}) {
    return jwt.sign(datos, jwtSecreta, {
      expiresIn: "1h",
    });
  }

  static jwt_dataExtraction(token = string) {
    try {
      const datos = jwt.verify(token, jwtSecreta);
      return { exito: true, datos: datos };
    } catch (err) {
      console.error(
        `Ocurrió un error al verificar los datos de la cookie: ${err.message}`
      );

      return { exito: false, error: "El contenido del token es inexacto" };
    }
  }

  static cookieParser_AccessTokenConfigs() {
    return {
      httpOnly: true, // Accesible solo en el servidor
      secure: process.env.CURRENT_ENV === "produccion", // Se activará dependiendo de la variable de entorno "CURRENT_ENV"
      sameSite: process.env.CURRENT_ENV === "produccion" ? "none" : "lax", // Restringe la cookie solo a nuestro dominio
      maxAge: 1000 * 60 * 60, // Al generarse, solo tiene una validez en un lapso de una hora
    };
  }

  static accessTokenValidation(token, idUsuario) {
    if (!token)
      return { exito: false, error: "El usuario no ha iniciado sesión" };

    const datos = jwt.verify(token, process.env.JWT_SECRET_KEY_D);

    if (datos.id != idUsuario)
      return {
        exito: false,
        error: "El usuario no coincide con el referente en los parámetros",
      };

    return { exito: true, error: "" };
  }
}

module.exports = ServiciosGenerales;
