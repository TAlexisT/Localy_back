const { admin, db } = require("../../Configuraciones");

class Modelo_Tramites_Pendientes {
  async crearTramitePendiente(
    price_id,
    correo,
    contrasena,
    telefono,
    usuario,
    renovacion
  ) {
    return await db.collection("tramites_pendientes").add({
      usuario,
      contrasena,
      telefono,
      correo,
      price_id,
      renovacion,
      tipo: "negocio",
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async obtenerTramitePendiente(tramite_id) {
    const docRef = await db
      .collection("tramites_pendientes")
      .doc(tramite_id)
      .get();

    return docRef.exists ? docRef : null;
  }

  async tramiteConcluido(tramite_id) {
    await db.collection("tramites_pendientes").doc(tramite_id).delete();
  }
}

module.exports = Modelo_Tramites_Pendientes;
