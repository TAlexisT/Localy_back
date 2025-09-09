const multer = require("multer");

const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Restaurante = require("../db/Restaurantes");
const Modelo_Tramites_Pendientes = require("../db/Tramites_Pendientes");
const Interaccion_Stripe = require("../ThirdParty/Stripe");

const bcrypt = require("bcrypt");

const servs = require("./Servicios");
const {
  esquemaPropietario,
  esquemaRestaurante,
} = require("../Schemas/Restaurantes");
const validador = require("../Validators/Validador");

const { front_URL, hashSaltRounds } = require("../../Configuraciones");

class Controlador_Restaurante {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloRestaurante;
  #modeloTramitesPendientes;
  #interaccionStripe;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloRestaurante = new Modelo_Restaurante();
    this.#modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
    this.#interaccionStripe = new Interaccion_Stripe();
  }

  obtenerNegocio = async (req, res) => {
    const { id } = req.params;

    if (!id)
      return req.status(400).json({
        error:
          "Es obligatorio añadir un id de restaurante en el cuerpo de la petición",
      });

    try {
      const doc = await this.#modeloRestaurante.obtenerNegocio(id);

      if (!doc.exists) {
        return res.status(404).json({ error: "Restaurante no encontrado" });
      }

      res.status(200).json(doc.data());
    } catch (err) {
      console.error("Error al obtener restaurante:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  obtenerLogo = async (req, res) => {
    const { id } = req.params;

    if (!id)
      return res
        .status(400)
        .json({ exito: false, error: "El ID no fue proporcionado." });

    try {
      const restauranteRef = await this.#modeloRestaurante.obtenerNegocio(
        id
      );
      if (!restauranteRef.exists || !restauranteRef.data().logo)
        return res.status(404).json({
          exito: false,
          error: `Los datos requeridos para el restaurante ${id} no fueron encontrados.`,
        });

      res.set("Content-Type", "image/svg+xml");
      return res.status(200).send(restauranteRef.data().logo);
    } catch (err) {
      console.log(
        `Ocurrio un error al obtener el logotipo del restaurante ${id}: ${err.message}`
      );
    }
  };

  actualizarPerfil = async (req, res) => {
    const restauranteId = req.params.id;
    const acceso = req.cookies.token_de_acceso;

    const validacion = validador(req.body, esquemaRestaurante);

    if (!validacion.exito) {
      return res.status(400).send({
        exito: validacion.exito,
        mensaje: validacion.mensaje,
        errores: validacion.errores,
      });
    }

    if (!restauranteId) {
      return res
        .status(400)
        .json({ error: "ID de restaurante no proporcionado." });
    }

    try {
      const propietario = await this.#modeloRestaurante.obtenerPropietario(
        restauranteId
      );

      if (propietario == null)
        return res.status(400).json({
          exito: false,
          error: "El propietario del restaurante no fue encontrado.",
        });

      const esValido = servs.accessTokenValidation(acceso, propietario);

      if (!esValido.exito) return res.status(401).json(esValido);

      await this.#modeloRestaurante.actualizarRestaurante(
        restauranteId,
        validacion.datos
      );

      res.status(200).json({ message: "Perfil guardado correctamente" });
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      res.status(500).json({ error: "Error al guardar el perfil" });
    }
  };

  actualizarLogo = async (req, res) => {
    const { id } = req.params;
    const acceso = req.cookies.token_de_acceso;

    try {
      const propietario = await this.#modeloRestaurante.obtenerPropietario(id);

      if (propietario == null)
        return res.status(400).json({
          exito: false,
          error: "El propietario del restaurante no fue encontrado.",
        });

      const esValido = servs.accessTokenValidation(acceso, propietario);

      if (!esValido.exito) return res.status(401).json(esValido);

      if (!req.file)
        return res
          .status(400)
          .json({ exito: false, error: "El logotipo no fue recibido." });

      const svgContenido = req.file.buffer.toString("utf8");

      if (!svgContenido.includes("<svg") || !svgContenido.includes("</svg>"))
        return req
          .status(400)
          .json({ exito: false, error: "El SVG no es valido." });

      await this.#modeloRestaurante.patchRestaurante(id, {
        logo: svgContenido,
      });

      return res.status(200).json({
        exito: true,
        mensaje: "El logotipo fue actualizado correctamente",
      });
    } catch (err) {
      console.error("Error updating SVG logo:", err);
      req.status(500).json({
        exito: false,
        error: "Ocurrió un error en el servidor.",
      });
    }
  };

  paginacionNegocios = async (req, res) => {
    const tamano = parseInt(req.query.pageSize) || 5;
    const seed =
      parseFloat(req.query.seed) || parseFloat(Math.random().toFixed(8));
    const cursor = parseFloat(req.query.cursor) || null;
    const direccion = req.query.direction || "siguiente"; // previo

    try {
      let consulta;
      let datos = [];

      if (!cursor) {
        // primera pagina
        var consultaAntes =
          await this.#modeloRestaurante.tamanoConsultaOrdenada(tamano, true);
        consultaAntes.where("randomKey", "<=", seed);

        var consultaDespues =
          await this.#modeloRestaurante.tamanoConsultaOrdenada(tamano, false);
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
        const esSup = cursor > seed;

        if (direccion === "siguiente") {
          // Next page - get records after cursor
          consulta = await this.#modeloRestaurante.tamanoConsultaOrdenada(
            tamano,
            false
          );
          consulta = consulta.where("randomKey", ">", cursor);

          const snapshot = await consulta.get();
          snapshot.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

          // If we don't have enough results, wrap around to beginning
          if (datos.length < tamano) {
            const consultaWrap =
              await this.#modeloRestaurante.tamanoConsultaOrdenada(
                tamano - datos.length,
                false
              );

            const snapshotWrap = await consultaWrap.get();
            snapshotWrap.forEach((doc) =>
              datos.push({ id: doc.id, ...doc.data() })
            );
          }
        } else if (direccion === "previo") {
          // Previous page - get records before cursor
          consulta = await this.#modeloRestaurante.tamanoConsultaOrdenada(
            tamano,
            true
          );
          consulta = consulta.where("randomKey", "<", cursor);

          const snapshot = await consulta.get();
          snapshot.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

          // If we don't have enough results, wrap around to end
          if (datos.length < tamano) {
            const consultaWrap =
              await this.#modeloRestaurante.tamanoConsultaOrdenada(
                tamano - datos.length,
                true
              );

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
        `${front_URL}/pago-exitoso?tramite_id=${tramitePendienteRef.id}`, // enfoque para "live"
        `${front_URL}/pago-erroneo`, // enfoque para "live"
        true
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
      return res
        .status(401)
        .json({ exito: false, error: "La sesión no fue encontrada." });
    if (!id)
      return res.status(400).json({
        exito: false,
        error: "El ID del negocio es requerido en los parametros de la URL.",
      });

    try {
    } catch (error) {}
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

module.exports = Controlador_Restaurante;
