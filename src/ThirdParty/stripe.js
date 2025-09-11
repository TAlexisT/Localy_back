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
    return await stripe.checkout.sessions.create({
      mode: recurrent ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: price_id, // this must be a recurring price if recurrent=true
          quantity: 1,
        },
      ],
      metadata,
      success_url,
      cancel_url,
    });
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
