import jsonwebtoken from "jsonwebtoken";
const { sign, verify } = jsonwebtoken;

import {
  jwtSecreta,
  bucket,
  pricesIdAmbulante,
  pricesIdRestaurante,
  entorno,
} from "../../Configuraciones.js";

class ServiciosGenerales {
  static jwt_accessToken(datos = {}) {
    return sign(datos, jwtSecreta, {
      expiresIn: "1h",
    });
  }

  static jwt_dataExtraction(token) {
    try {
      const datos = verify(token, jwtSecreta);
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
      secure: entorno === "produccion", // Se activará dependiendo de la variable de entorno "entorno"
      sameSite: entorno === "produccion" ? "none" : "lax", // Restringe la cookie solo a nuestro dominio
      maxAge: 1000 * 60 * 60, // Al generarse, solo tiene una validez en un lapso de una hora
    };
  }

  static accessTokenValidation(token, idUsuario) {
    if (!token)
      return { exito: false, error: "El usuario no ha iniciado sesión" };

    const datos = verify(token, process.env.JWT_SECRET_KEY_D);

    if (datos.id != idUsuario)
      return {
        exito: false,
        error: "El usuario no coincide con el referente en los parámetros",
      };

    return { exito: true, error: "" };
  }

  static soloURLs(imagObjetos) {
    return imagObjetos
      ? Object.fromEntries(
          Object.entries(imagObjetos).map(([key, item]) => [
            key,
            item?.url || item,
          ])
        )
      : {};
  }

  static soloURL(imagObjeto) {
    return imagObjeto?.url || imagObjeto;
  }

  static membresiaTipo(priceId) {
    return pricesIdAmbulante.includes(priceId)
      ? "ambulante"
      : pricesIdRestaurante.includes(priceId)
      ? "restaurante"
      : null;
  }

  static async borrarRuta(ruta, directorio = false) {
    if (!directorio) {
      const archivo = bucket.file(ruta);
      await archivo.delete();
    } else {
      const prefix = ruta.endsWith("/") ? ruta : `${ruta}/`;
      await bucket.deleteFiles({ prefix: prefix });
    }
  }
}

export default ServiciosGenerales;
