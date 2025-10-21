const dayjs = require("dayjs");
const cron = require("node-cron");

const { db, admin } = require("../../Configuraciones");

const servs = require("../Services/ServiciosGenerales");

class suscripcionJobs {
  constructor() {
    this.jobs = [];
  }

  init() {
    // Schedule daily job at 00:00:00
    const dailyJob = cron.schedule(
      "0 */12 * * *",
      async () => {
        console.log(
          "🕛 Daily job started at:",
          admin.firestore.FieldValue.serverTimestamp()
        );

        try {
          await this.#executeDailyTasks();
          console.log("✅ Daily job completed successfully");
        } catch (error) {
          console.error("❌ Daily job failed:", error);
        }
      },
      {
        scheduled: true,
        timezone: "America/Mexico_City",
      }
    );

    this.jobs.push(dailyJob);
    console.log("📅 Daily job scheduled to run at 00:00:00 daily");
  }

  async #executeDailyTasks() {
    await this.#desactivarRetardados();
    await this.#eliminarRetardados();
  }

  async #desactivarRetardados() {
    try {
      // Alinear con el tiempo del servidor
      const now = admin.firestore.Timestamp.now().toDate();
      // Fecha de referencia: 1 més atras
      const unMesAtras = dayjs(now).subtract(1, "month").toDate();

      const snapshot = await db
        .collection("negocios")
        .where("activo", "==", true)
        .where("stripe.recurrente", "==", false)
        .where("pago_fecha", "<", unMesAtras)
        .get();

      if (snapshot.empty) {
        console.log("✅ No hay negocios retardados para desactivar");
        return;
      }

      let batch = db.batch();
      let batchCounter = 0;
      const MAX_BATCH_SIZE = 450; // Permanecer por de bajo del limite de firebase; 500

      for (const doc of snapshot.docs) {
        // 🧹 inhabilitar los productos relacionados
        const productosSnap = await db
          .collection("productos")
          .where("negocio_id", "==", doc.id)
          .get();

        for (const prod of productosSnap.docs) {
          batch.update(prod.ref, {
            activo: false,
            actualizado: admin.firestore.FieldValue.serverTimestamp(),
          });
          batchCounter++;
        }

        // 🏢 Por último, actualizamos el mismo negocio
        batch.update(doc.ref, {
          activo: false,
          actualizado: admin.firestore.FieldValue.serverTimestamp(),
        });
        batchCounter++;

        // Commits de control para no exceder el maximo de operaciones batch
        if (batchCounter >= MAX_BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchCounter = 0;
        }
      }

      await batch.commit();

      console.log(
        `🧹 Se han desactivado ${snapshot.size} negocios con pago retardado.`
      );
    } catch (err) {
      console.error("❌ Ocurrió un error al desactivar retardados:", err);
    }
  }

  async #eliminarRetardados() {
    try {
      // Use Firestore server-aligned time
      const now = admin.firestore.Timestamp.now().toDate();
      const seisMesesAtras = dayjs(now).subtract(6, "month").toDate();

      const snapshot = await db
        .collection("negocios")
        .where("activo", "==", false)
        .where("pago_fecha", "<", seisMesesAtras)
        .get();

      if (snapshot.empty) {
        console.log("✅ No hay negocios retardados para eliminar");
        return;
      }

      let batch = db.batch();
      let batchCounter = 0;
      const MAX_BATCH_SIZE = 450; // Permanecer por de bajo del limite de firebase; 500

      for (const doc of snapshot.docs) {
        const datos = doc.data();

        // 🧹 Borramos los productos relacionados
        const productosSnap = await db
          .collection("productos")
          .where("negocio_id", "==", doc.id)
          .get();

        for (const prod of productosSnap.docs) {
          batch.delete(prod.ref);
          batchCounter++;
        }

        // 🧑 Borramos el propietario correspondiente
        if (datos.usuarioId) {
          const usuarioRef = db.collection("usuarios").doc(datos.usuarioId);
          batch.delete(usuarioRef);
          batchCounter++;
        }

        // 🗑️ Borramos todos los archivos relacionados al negocio
        try {
          await servs.borrarRuta(`negocios/negocio_${doc.id}/`, true);
        } catch (err) {
          console.warn(
            `⚠️ No se pudo eliminar directorio del negocio ${doc.id}:`,
            err.message
          );
        }

        // 🏢 Por último, borramos el mismo negocio
        batch.delete(doc.ref);
        batchCounter++;

        // Commits de control para no exceder el maximo de operaciones batch
        if (batchCounter >= MAX_BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchCounter = 0;
        }
      }

      // commit a las operaciones restantes
      if (batchCounter > 0) {
        await batch.commit();
      }

      console.log(
        `🧹 Se han eliminado ${snapshot.size} negocios con pago retardado.`
      );
    } catch (err) {
      console.error("❌ Ha ocurrido un error al eliminar retardados:", err);
    }
  }

  // Utility method to manually trigger the job for testing
  async triggerManualRun() {
    console.log("🔧 Manually triggering daily job...");
    await this.#executeDailyTasks();
  }

  stopAllJobs() {
    this.jobs.forEach((job) => job.stop());
    console.log("🛑 All scheduled jobs stopped");
  }
}

module.exports = suscripcionJobs;
