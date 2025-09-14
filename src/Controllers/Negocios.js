const multer = require("multer");

const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Negocio = require("../db/Negocios");
const Modelo_Tramites_Pendientes = require("../db/Tramites_Pendientes");
const Interaccion_Stripe = require("../ThirdParty/Stripe");

const bcrypt = require("bcrypt");

const servs = require("../Services/ServiciosGenerales");
const { esquemaPropietario, esquemaNegocio } = require("../Schemas/Negocios");
const { validador } = require("../Validators/Validador");

const { front_URL, hashSaltRounds } = require("../../Configuraciones");

class Controlador_Negocio {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloNegocio;
  #modeloTramitesPendientes;
  #interaccionStripe;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloNegocio = new Modelo_Negocio();
    this.#modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
    this.#interaccionStripe = new Interaccion_Stripe();
  }

  obtenerNegocio = async (req, res) => {
    const { id } = req.params;

    if (!id)
      return req.status(400).json({
        error:
          "Es obligatorio añadir un id de negocio en el cuerpo de la petición",
      });

    try {
      const doc = await this.#modeloNegocio.obtenerNegocio(id);

      if (!doc.exists)
        return res.status(404).json({ error: "Negocio no encontrado" });

      const {
        randomKey,
        usuarioId,
        creado,
        actualizado,
        tamano,
        ...otrosDatos
      } = doc.data();

      res.status(200).json({ exito: true, datos: otrosDatos });
    } catch (err) {
      console.error("Error al obtener negocio:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  actualizarPerfil = async (req, res) => {
    const negocioId = req.params.id;
    const acceso = req.cookies.token_de_acceso;

    const validacion = validador(req.body, esquemaNegocio);

    if (!validacion.exito) {
      return res.status(400).send({
        exito: validacion.exito,
        mensaje: validacion.mensaje,
        errores: validacion.errores,
      });
    }

    if (!negocioId) {
      return res.status(400).json({ error: "ID de negocio no proporcionado." });
    }

    try {
      const propietario = await this.#modeloNegocio.obtenerPropietario(
        negocioId
      );

      if (propietario == null)
        return res.status(400).json({
          exito: false,
          error: "El propietario del negocio no fue encontrado.",
        });

      const esValido = servs.accessTokenValidation(acceso, propietario);

      if (!esValido.exito) return res.status(401).json(esValido);

      const svgContenido = req.file.buffer.toString("utf8") ?? "";

      if (svgContenido.includes("<svg") && svgContenido.includes("</svg>"))
        validacion.datos.logo = svgContenido;

      await this.#modeloNegocio.actualizarNegocio(negocioId, validacion.datos);

      res
        .status(200)
        .json({ exito: true, message: "Perfil guardado correctamente" });
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      res.status(500).json({ error: "Error al guardar el perfil" });
    }
  };

  paginacionNegocios = async (req, res) => {
    const tamano = parseInt(req.query.pageSize) || 5;
    const seed =
      parseFloat(req.query.seed) || parseFloat(Math.random().toFixed(8));
    const cursor = parseFloat(req.query.cursor) || null;
    const direccion = req.query.direction || "siguiente"; // previo

    try {
      var consulta;
      var datos = [];

      if (!cursor) {
        // primera pagina
        var consultaAntes = await this.#modeloNegocio.tamanoConsultaOrdenada(
          tamano,
          true
        );
        consultaAntes = consultaAntes.where("randomKey", "<=", seed);

        var consultaDespues = await this.#modeloNegocio.tamanoConsultaOrdenada(
          tamano,
          false
        );
        consultaAntes = consultaAntes.where("randomKey", ">", seed);

        const [snapshotAntes, snapshotDespues] = await Promise.all([
          consultaAntes.get(),
          consultaDespues.get(),
        ]);

        // convina los valores aunque prioriza los valores mayores a "seed"
        snapshotAntes.forEach((doc) =>
          datos.push({ id: doc.id, ...doc.data() })
        );
        snapshotDespues.forEach((doc) =>
          datos.push({ id: doc.id, ...doc.data() })
        );

        // Trim to page size
        datos = datos.slice(0, tamano);
      } else {
        if (direccion === "siguiente") {
          // Next page - get records after cursor
          consulta = await this.#modeloNegocio.tamanoConsultaOrdenada(
            tamano,
            false
          );
          consulta = consulta.where("randomKey", ">", cursor);

          const snapshot = await consulta.get();
          snapshot.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

          // If we don't have enough results, wrap around to beginning
          if (datos.length < tamano) {
            var consultaWrap = await this.#modeloNegocio.tamanoConsultaOrdenada(
              tamano - datos.length,
              false
            );
            consultaWrap = consultaWrap.where("randomKey", "<", seed);

            const snapshotWrap = await consultaWrap.get();
            snapshotWrap.forEach((doc) =>
              datos.push({ id: doc.id, ...doc.data() })
            );
          }
        } else if (direccion === "previo") {
          // Previous page - get records before cursor
          consulta = await this.#modeloNegocio.tamanoConsultaOrdenada(
            tamano,
            true
          );
          consulta = consulta.where("randomKey", "<", cursor);

          const snapshot = await consulta.get();
          snapshot.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

          // If we don't have enough results, wrap around to end
          if (datos.length < tamano) {
            var consultaWrap = await this.#modeloNegocio.tamanoConsultaOrdenada(
              tamano - datos.length,
              true
            );

            consultaWrap = consultaWrap.where("randomKey", ">", seed);

            const snapshotWrap = await consultaWrap.get();
            // Reverse to maintain chronological order
            const wrapData = [];
            snapshotWrap.forEach((doc) =>
              wrapData.push({ id: doc.id, ...doc.data() })
            );
            datos = [...wrapData.reverse(), ...datos].slice(0, tamano);
          }
          datos.reverse();
        }
      }

      const primerToken = datos.length > 0 ? datos[0].randomKey : null;
      const ultimoToken =
        datos.length > 0 ? datos[datos.length - 1].randomKey : null;

      res.status(200).json({
        datos,
        primerToken,
        ultimoToken,
        seed, // Return the seed for consistent pagination
      });
    } catch (error) {
      console.error("Error en paginación:", error);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  negocioRegistro = async (req, res) => {
    const { recurrente } = req.body;
    const validacion = validador(req.body, esquemaPropietario);

    if (!validacion.exito) {
      return res.status(400).send({
        exito: false,
        mensaje: validacion.mensaje,
        errores: validacion.errores,
      });
    }

    const { price_id, correo, contrasena, telefono, usuario } =
      validacion.datos;

    var tramitePendienteRef = null;

    try {
      if (
        (await this.#modeloUsuario.nombreExiste(usuario)) ||
        (await this.#modeloUsuario.correoExiste(correo)) ||
        (await this.#modeloTramitesPendientes.existeTramiteUsuario(usuario))
      )
        return res.status(403).json({
          exito: false,
          error:
            "El nombre de usuario o el correo electrónico o ambos ya están en uso.",
        });
      tramitePendienteRef =
        await this.#modeloTramitesPendientes.crearTramitePendiente(
          price_id,
          correo,
          await bcrypt.hash(contrasena, hashSaltRounds),
          telefono,
          usuario,
          false
        );

      const session = await this.#interaccionStripe.crearSession(
        price_id,
        { tramiteId: tramitePendienteRef.id },
        `${front_URL}/pago-exito?tramite_id=${tramitePendienteRef.id}`, // enfoque para "live"
        `${front_URL}/pago-error`, // enfoque para "live"
        recurrente ?? false
      );

      return res.status(202).json({ exito: true, url: session.url });
    } catch (err) {
      console.error("El metodo fallo al crear una nueva sesion: ", err);
      if (tramitePendienteRef.id)
        this.#modeloTramitesPendientes.tramiteConcluido(tramitePendienteRef.id);
      return res.status(500).json({
        exito: false,
        error: "No se pudo concretar el tramite.",
      });
    }
  };

  negocioPriceRenovacion = async (req, res) => {
    const { id } = req.params;
    const acceso = req.cookies.token_de_acceso;

    if (!acceso)
      // mejorar la validacion
      return res.status(401).json({
        exito: false,
        error:
          "La sesión necesita estar activa para poder renovar la suscripción.",
      });
    if (!id)
      return res.status(400).json({
        exito: false,
        error: "El ID del negocio es requerido en los parametros de la URL.",
      });

    try {
      tramitePendienteRef =
        await this.#modeloTramitesPendientes.crearTramitePendiente_Renovacion(
          id
        );

      const session = await this.#interaccionStripe.crearSession(
        price_id,
        { tramiteId: tramitePendienteRef.id },
        `${front_URL}/renovacion-exito?tramite_id=${tramitePendienteRef.id}`, // enfoque para "live"
        `${front_URL}/renovacion-error`, // enfoque para "live"
        recurrente ?? false
      );

      return res.status(202).json({ exito: true, url: session.url });
    } catch (err) {
      console.error("Error al renovar la subscripcion:", err);
      res
        .status(500)
        .json({ exito: false, error: "Error al renovar la subscripcion" });
    }
  };

  logoUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024, // 100KB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "image/svg+xml") {
        cb(null, true);
      } else {
        cb(new Error("Only SVG files are allowed"), false);
      }
    },
  });
}

module.exports = Controlador_Negocio;
