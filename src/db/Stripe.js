import { admin, db } from "../../Configuraciones.js";

class Modelo_Stripe {
  async eventAlreadyHandled(eventId) {
    const ref = await db.collection("stripe_event_logs").doc(eventId).get();
    return ref.exists;
  }

  async saveEventId(eventId) {
    await db
      .collection("stripe_event_logs")
      .doc(eventId)
      .set({
        processedAt: new Date(),
        expira_en: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 86400000)   // 24h
        ), 
      });
  }
}

export default Modelo_Stripe;
