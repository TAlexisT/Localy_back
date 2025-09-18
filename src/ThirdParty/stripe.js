const { stripe } = require("../../Configuraciones");
require("dotenv").config();

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
    return stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.TEST_WH_SECRET
    );
  };
}

module.exports = Interaccion_Stripe;
