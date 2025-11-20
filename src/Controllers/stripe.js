// Interaccion con base de datos
import Modelo_Usuario from "../db/Usuarios.js";
import Modelo_Negocio from "../db/Negocios.js";
import Modelo_Productos from "../db/Productos.js";
import Modelo_Tramites_Pendientes from "../db/Tramites_Pendientes.js";
import Modelo_Stripe from "../db/Stripe.js";

// Interaccion con ThirdParty
import Interaccion_Stripe from "../ThirdParty/Stripe.js";

class Controlador_Stripe {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloNegocio;
  #modeloProducto;
  #modeloTramitesPendientes;
  #interaccionStripe;
  #modeloStripe;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloNegocio = new Modelo_Negocio();
    this.#modeloProducto = new Modelo_Productos();
    this.#modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
    this.#interaccionStripe = new Interaccion_Stripe();
    this.#modeloStripe = new Modelo_Stripe();
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

    if (await this.#modeloStripe.eventAlreadyHandled(event.id)) {
      console.warn("Evento duplicado ignorado:", event.id);
      return res.status(200).json({ received: true });
    }

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

        case "customer.subscription.deleted":
          await this.#desactivarSesion(event.data.object);
          break;

        default:
          console.warn(`Evento no manejado: ${event.type}`);
          break;
      }

      await this.#modeloStripe.saveEventId(event.id);
    } catch (err) {
      console.error("Error processing webhook:", err);
      return res.status(500).json({ error: "El proceso ha fallado" });
    }
    return res.status(200).json({ received: true });
  };

  // Metodos privados
  #pagoInicial = async (session) => {
    const customer_id = session.customer;
    const { tramiteId, recurrente } = session.metadata;

    const tramiteSnap =
      await this.#modeloTramitesPendientes.obtenerTramitePendiente(tramiteId);

    if (!tramiteSnap.exists) {
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
      membresia,
    } = tramiteSnap.data();

    if (renovacion) {
      if (!negocio_id) return;

      await this.#modeloNegocio.renovarSubscripcion(
        negocio_id,
        price_id,
        customer_id,
        JSON.parse(recurrente),
        membresia
      );

      const productosSnap = await this.#modeloProducto.obtenerProductosNegocio(
        negocio_id
      );

      for (const prod of productosSnap.docs) {
        await this.#modeloProducto.patchProducto(prod.id, { activo: true });
      }
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
      customer_id,
      JSON.parse(recurrente),
      membresia
    );

    await this.#modeloTramitesPendientes.procesandoTramiteNegocio(
      tramiteId,
      negocioRef.id,
      usuarioRef.id
    );
  };

  #refrescarSesion = async (session) => {
    const customer_id = session.customer;
    await this.#modeloNegocio.refrescarSubscripcion(customer_id);
  };

  #desactivarSesion = async (session) => {
    const customer_id = session.customer;
    await this.#modeloNegocio.desactivarSubscripcion(customer_id);
  };
}

export default Controlador_Stripe;
