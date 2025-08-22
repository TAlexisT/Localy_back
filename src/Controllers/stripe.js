const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Restaurante = require("../db/Restaurantes");
const Modelo_Tramites_Pendientes = require("../db/tramites_pendientes");
const Interaccion_Stripe = require("../ThirdParty/stripe");

class Controlador_Stripe {
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

  webhookBase = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = this.#interaccionStripe.eventConstructor(req.body, sig);
    } catch (err) {
      console.error("Webhook verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log(`The event was recived:`, event);

    if (event.type !== "checkout.session.completed") {
      console.log(
        "The event was made but the type doesn't actually match to the required one"
      );
      return res.status(200).json({ received: true });
    }
    const session = event.data.object;
    try {
      const tramiteId = session.metadata.tramiteId;

      const tramiteSnap =
        await this.#modeloTramitesPendientes.obtenerTramitePendiente(tramiteId);

      if (tramiteSnap == null) {
        console.warn("Trámite no encontrado:", tramiteId);
        return res.status(200).json({ received: true });
      }

      await this.#modeloTramitesPendientes.tramiteConcluido(tramiteId);

      const {
        usuario,
        contrasena,
        telefono,
        correo,
        price_id,
        renovacion,
        tipo,
      } = tramiteSnap.data();

      if (renovacion) return res.json({ received: true });

      // const hashed = await bcrypt.hash(contrasena, 10);

      const usuarioRef = await this.#modeloUsuario.registrarUsuario(
        usuario,
        contrasena, // : hashed,
        correo,
        tipo,
        telefono
      );

      const restauranteRef = await this.#modeloRestaurante.crearRestaurante(
        usuarioRef.id,
        correo,
        telefono,
        price_id
      );

      console.log(
        "Usuario y restaurante creados:",
        usuarioRef.id,
        restauranteRef.id
      );
    } catch (err) {
      console.error("Error en webhook:", err);
    }
    return res.status(200).json({ received: true });
  };
}

module.exports = Controlador_Stripe;
