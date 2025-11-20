import { stripe, webhook, front_URL } from "../../Configuraciones.js";

class Interaccion_Stripe {
  async crearSession(
    price_id,
    metadata = {},
    success_url,
    cancel_url,
    recurrent
  ) {
    const sessionConfig = {
      mode: recurrent ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price_id, // must be recurring if recurrent=true
          quantity: 1,
        },
      ],
      metadata,
      success_url,
      cancel_url,
    };

    // Only include customer_creation if it's a one-time payment
    if (!recurrent) {
      sessionConfig.customer_creation = "always";
    }

    return await stripe.checkout.sessions.create(sessionConfig);
  }

  eventConstructor = (body, sig) => {
    return stripe.webhooks.constructEvent(body, sig, webhook);
  };

  facturacionPortal = async (customer_id) => {
    return await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: front_URL,
    });
  };
}

export default Interaccion_Stripe;
