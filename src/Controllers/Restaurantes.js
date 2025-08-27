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
    const seed =
      parseFloat(req.query.seed) || parseFloat(Math.random().toFixed(8));
    const cursor = parseFloat(req.query.cursor) || null;
    const direccion = req.query.direction || "siguiente";

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
