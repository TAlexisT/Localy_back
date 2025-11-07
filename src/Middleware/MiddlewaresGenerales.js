import busboy from "busboy";
import ServiciosGenerales from "../Services/ServiciosGenerales.js";
import Negocios_Modelo from "../db/Negocios.js";

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
    const jwtExtraccion = ServiciosGenerales.jwt_dataExtraction(acceso);
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

  // ✅ Configuración optimizada para Firebase Functions
  manejadorArchivos = async (req, res, next) => {
    if (!req.headers["content-type"]?.includes("multipart/form-data")) {
      return next();
    }

    console.log("🛠️ Manual Form Processor - Starting...");

    // Verificar que tenemos el buffer
    if (!req.body || !Buffer.isBuffer(req.body)) {
      console.log("❌ No buffer found in request");
      return next(); // Continuar sin procesar
    }

    console.log(`📦 Processing buffer of ${req.body.length} bytes`);

    const bb = busboy({
      headers: {
        "content-type": req.headers["content-type"],
        "content-length": req.headers["content-length"],
      },
      limits: {
        fileSize: 2 * 1024 * 1024,
        fields: 100,
      },
    });

    const fields = {};
    let fileBuffer = null;
    let fileInfo = null;

    bb.on("field", (name, value) => {
      console.log(
        `📋 Field [${name}]:`,
        value.length > 100 ? value.substring(0, 100) + "..." : value
      );
      fields[name] = value;
    });

    bb.on("file", (name, file, info) => {
      console.log(`📁 File [${name}]:`, info);
      fileInfo = { name, info };

      const chunks = [];
      file.on("data", (chunk) => {
        chunks.push(chunk);
      });

      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
        console.log(`✅ File [${name}] processed: ${fileBuffer.length} bytes`);
      });

      file.on("error", (err) => {
        console.error(`❌ File [${name}] error:`, err);
      });
    });

    bb.on("close", () => {
      console.log("✅ Manual form processing completed");
      console.log("📊 Fields found:", Object.keys(fields));
      console.log("📊 File received:", !!fileBuffer);

      // Asignar los campos procesados al request
      req.body = fields;

      // Si hay archivo, asignarlo
      if (fileBuffer && fileInfo) {
        req.file = {
          fieldname: fileInfo.name,
          originalname: fileInfo.info.filename,
          mimetype: fileInfo.info.mimeType,
          buffer: fileBuffer,
          size: fileBuffer.length,
        };
      }

      next();
    });

    bb.on("error", (err) => {
      console.error("❌ Busboy error:", err);
      res.status(400).json({
        mensaje: "Error procesando el formulario",
        error: err.message,
      });
    });

    // Escribir el buffer a busboy
    bb.write(req.body);
    bb.end();
  };
}

export default MiddlewaresGenerales;
