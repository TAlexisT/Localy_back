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

  async procesandoTramite(tramite_id, restauranteId) {
    const refDoc = db.collection("tramites_pendientes").doc(tramite_id);

    await refDoc.update({
      contrasena: admin.firestore.FieldValue.delete(),
      correo: admin.firestore.FieldValue.delete(),
      usuario: admin.firestore.FieldValue.delete(),
      restaurante_id: restauranteId,
    });
  }

  async tramiteConcluido(tramite_id) {
    await db.collection("tramites_pendientes").doc(tramite_id).delete();
  }
}

module.exports = Modelo_Tramites_Pendientes;
