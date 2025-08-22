require("dotenv").config();
const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Restaurante = require("../db/Restaurantes");
const Modelo_Tramites_Pendientes = require("../db/tramites_pendientes");
const Interaccion_Stripe = require("../ThirdParty/stripe");

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

  obtenerRestaurante = async (req, res) => {
    const { id } = req.params;

    if (!id)
      return req.status(400).json({
        error:
          "Es obligatorio añadir un id de restaurante en el cuerpo de la petición",
      });

    try {
      const doc = await this.#modeloRestaurante.obtenerRestaurante(id);

      if (!doc.exists) {
        return res.status(404).json({ error: "Restaurante no encontrado" });
      }

      res.status(200).json(doc.data());
    } catch (err) {
      console.error("Error al obtener restaurante:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  actualizarPerfil = async (req, res) => {
    const restauranteId = req.params.id;
    const datos = req.body;

    // ¡¡¡ Necesitamos una validación de los datas para asegurarnos de ningun tipo de brecha de seguridad !!!!

    if (!restauranteId) {
      return res
        .status(400)
        .json({ error: "ID de restaurante no proporcionado." });
    }

    try {
      await this.#modeloRestaurante.actualizarRestaurante(restauranteId, datos);

      res.status(200).json({ message: "Perfil guardado correctamente" });
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      res.status(500).json({ error: "Error al guardar el perfil" });
    }
  };

  paginacionRestaurantes = async (req, res) => {
    const tamano = parseInt(req.query.pageSize) || 5;
    const cursorId = req.query.cursor || null;
    const direccion = req.query.direction || "siguiente";

    try {
      let consulta = await this.#modeloRestaurante.tamanoConsultaOrdenada(
        tamano,
        "desc"
      );
      const paginas = Math.ceil(
        (await this.#modeloRestaurante.totalDeRestaurantes()) / tamano
      );

      if (cursorId) {
        const cursorDoc = await this.#modeloRestaurante.obtenerRestaurante(
          cursorId
        );
        if (cursorDoc.exists) {
          if (direccion === "siguiente") {
            consulta = consulta.startAfter(cursorDoc);
          } else if (direccion === "previo") {
            // Para navegación hacia atrás, necesitamos invertir el orden temporalmente
            consulta = consulta.endBefore(cursorDoc);
          }
        }
      }

      const preVista = await consulta.get();
      if (preVista.empty) {
        return res.status(200).json({
          datos: [],
          primerToken: null,
          ultimoToken: null,
          paginas,
          paginaActual: 0,
          existeProx: false,
          existeAnt: false,
        });
      }

      let datos = [];
      preVista.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

      const primerToken = preVista.docs[0].id;
      const ultimoToken = preVista.docs[preVista.docs.length - 1].id;

      let paginaActual = 0;
      if (cursorId) {
        const index =
          (await this.#modeloRestaurante.posicionActual(primerToken, "desc")) +
          1;

        paginaActual = Math.ceil(index / tamano);
      } else paginaActual = 1;

      res.status(200).json({
        datos,
        primerToken,
        ultimoToken,
        paginas,
        paginaActual,
        existeProx: paginaActual < paginas,
        existeAnt: paginaActual > 1,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  };

  negocioRegistro = async (req, res) => {
    const { price_id, correo, contrasena, telefono, usuario } = req.body;

    if (!price_id | !correo | !contrasena | !telefono | !usuario) {
      return res.status(400).send({
        mensaje:
          "Todos los campos (price_id, correo, contrasena, telefono, usuario) son obligatorios.",
      });
    }

    var tramitePendienteRef = null;

    try {
      if (
        (await this.#modeloUsuario.nombreExiste(usuario)) ||
        (await this.#modeloUsuario.correoExiste(correo))
      )
        return res.status(403).json({
          mensaje:
            "El nombre de usuario o el correo electrónico o ambos ya están en uso.",
        });

      tramitePendienteRef =
        await this.#modeloTramitesPendientes.crearTramitePendiente(
          price_id,
          correo,
          contrasena,
          telefono,
          usuario,
          false
        );
    } catch (err) {
      if (tramitePendienteRef.id)
        this.#modeloTramitesPendientes.tramiteConcluido(tramitePendienteRef.id);
      console.error("Error al crear sesión de Stripe:", err);
      return res.status(500).json({
        mensaje: "Se produjo un error al validar o registrar el procedimiento.",
      });
    }

    try {
      const session = await this.#interaccionStripe.crearSession(
        price_id,
        { tramiteId: tramitePendienteRef.id },
        `${process.env.FRONTEND_URL}/pago-exitoso`, // enfoque para "live"
        `${process.env.FRONTEND_URL}/pago-erroneo`,  // enfoque para "live"
        true
      );

      return res.status(202).json({ url: session.url });
    } catch (err) {
      console.error("El metodo fallo al crear una nueva sesion: ", err)
      if (tramitePendienteRef.id)
        this.#modeloTramitesPendientes.tramiteConcluido(tramitePendienteRef.id);
      return res.status(500).json({
        mensaje: "No se pudo concretar el tramite." + err.message,
      });
    }
  };
}

module.exports = Controlador_Restaurante;
