const { string } = require("joi");
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

  async crearTramitePendiente_Renovacion(negocio_id, price_id) {
    return await db.collection("tramites_pendientes").add({
      negocio_id,
      price_id,
      renovacion: true,
    });
  }

  async obtenerTramitePendiente(tramite_id) {
    const docRef = await db
      .collection("tramites_pendientes")
      .doc(tramite_id)
      .get();

    return docRef;
  }

  async procesandoTramite(tramite_id, negocioId, usuarioId) {
    const refDoc = db.collection("tramites_pendientes").doc(tramite_id);

    await refDoc.update({
      contrasena: admin.firestore.FieldValue.delete(),
      correo: admin.firestore.FieldValue.delete(),
      usuario: admin.firestore.FieldValue.delete(),
      negocio_id: negocioId,
      usuario_id: usuarioId,
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async tramiteConcluido(tramite_id) {
    await db.collection("tramites_pendientes").doc(tramite_id).delete();
  }

  // Este metodo funciona para los tramites pendientes, no para los tramites que ya se encuentran en proceso
  // Los tramites que ya se encuentran en proceso no contienen el nombre del usuario...
  async existeTramiteUsuario(usuario = string) {
    const enTramite = await db
      .collection("tramites_pendientes")
      .where("usuario", "==", usuario)
      .limit(1)
      .get();

    return !enTramite.empty;
  }
}

module.exports = Modelo_Tramites_Pendientes;
