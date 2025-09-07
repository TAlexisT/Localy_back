const jwt = require("jsonwebtoken");

class servicios {
  static jwt_accessToken(datos = {}) {
    var secreta;

    switch (key) {
      case "produccion":
        secreta = process.env.JWT_SECRET_KEY_P;
        break;

      case "desarrollo":
        secreta = process.env.JWT_SECRET_KEY_D;
        break;

      case "test":
        secreta = process.env.JWT_SECRET_KEY_T;
        break;

      default:
        break;
    }

    return jwt.sign(datos, secreta, {
      expiresIn: "1h",
    });
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

module.exports = servicios;
