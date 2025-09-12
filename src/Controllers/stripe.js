const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Negocio = require("../db/Negocios");
const Modelo_Tramites_Pendientes = require("../db/Tramites_Pendientes");
const Interaccion_Stripe = require("../ThirdParty/Stripe");
const ServiciosStripe = require("./Servicios/ServiciosStripe");

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
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.#pagoInicial(event.data.object);
          break;

        case "invoice.payment_succeeded":
          await this.#refrescarSesion(event.data.object);
          break;

        case "invoice.payment_failed":
          await this.#desactivarSesion(event.data.object);
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Error processing webhook:", err);
      return res.status(500).json({ error: "El proceso ha fallado" });
    }
    return res.status(200).json({ received: true });
  };

  // Metodos privados
  #pagoInicial = async (session) => {
    const subscriptionId = session.subscription;
    const customerId = session.customer;
    const tramiteId = session.metadata?.tramiteId;

    const tramiteSnap =
      await this.#modeloTramitesPendientes.obtenerTramitePendiente(tramiteId);

    if (tramiteSnap == null) {
      console.warn("Trámite no encontrado:", tramiteId);
      return;
    }

    const {
      usuario,
      contrasena,
      telefono,
      correo,
      price_id,
      renovacion,
      negocio_id,
      tipo,
    } = tramiteSnap.data();

    if (renovacion) {
      await this.#modeloTramitesPendientes.tramiteConcluido(tramiteId);

      if (!negocio_id) return;

      await this.#modeloNegocio.renovarSubscripcion(
        negocio_id,
        price_id,
        subscriptionId,
        customerId
      );
      return;
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
      price_id,
      subscriptionId,
      customerId
    );

    await this.#modeloTramitesPendientes.procesandoTramite(
      tramiteId,
      negocioRef.id
    );
  };

  #refrescarSesion = async (session) => {
    const subscriptionId = session.subscription;
    await this.#modeloNegocio.refrescarSubscripcion(subscriptionId);
  };

  #desactivarSesion = async (session) => {
    const subscripcionId = session.subscription;
    await this.#modeloNegocio.desactivarSubscripcion(subscripcionId);
  };
}

module.exports = Controlador_Stripe;
