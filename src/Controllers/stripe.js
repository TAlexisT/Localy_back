const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Negocio = require("../db/Negocios");
const Modelo_Tramites_Pendientes = require("../db/Tramites_Pendientes");
const Interaccion_Stripe = require("../ThirdParty/Stripe");

class Controlador_Stripe {
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

  webhookBase = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = this.#interaccionStripe.eventConstructor(req.body, sig);
    } catch (err) {
      console.error("Falló la verificación del webhook:", err.message);
      return res.status(400).json({ received: true });
    }

    /**
     * Necesitamos hacer un switch para poder gestionar diferentes escenarios y permitir los pagos periódicos.
     */
    if (event.type !== "checkout.session.completed") {
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

      const {
        usuario,
        contrasena,
        telefono,
        correo,
        price_id,
        renovacion,
        tipo,
      } = tramiteSnap.data();

      if (renovacion) {
        await this.#modeloTramitesPendientes.tramiteConcluido(tramiteId);
        return res.json({ received: true });
      }

      const usuarioRef = await this.#modeloUsuario.registrarUsuario(
        usuario,
        contrasena,
        correo,
        tipo,
        telefono
      );

      const negocioRef = await this.#modeloNegocio.crearNegocio(
        usuarioRef.id,
        correo,
        telefono,
        price_id
      );

      await this.#modeloTramitesPendientes.procesandoTramite(
        tramiteId,
        negocioRef.id
      );
    } catch (err) {
      console.error("Error en webhook:", err);
    }
    return res.status(200).json({ received: true });
  };
}

module.exports = Controlador_Stripe;
