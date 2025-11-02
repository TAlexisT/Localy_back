import { admin, db } from "../../Configuraciones.js";

class Modelo_Tramites_Pendientes {
  async crearTramitePendienteNegocios(
    price_id,
    correo,
    contrasena,
    telefono,
    usuario,
    token_verificacion,
    renovacion,
    membresia
  ) {
    return await db.collection("tramites_pendientes").add({
      usuario,
      contrasena,
      telefono,
      correo,
      price_id,
      renovacion,
      membresia,
      tipo: "negocio",
      token_verificacion,
      creado: admin.firestore.FieldValue.serverTimestamp(),
      expira_en: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      ),
    });
  }

  async crearTramitePendienteUsuario(
    correo,
    contrasena,
    usuario,
    token_verificacion
  ) {
    return await db.collection("tramites_pendientes").add({
      correo,
      contrasena,
      usuario,
      tipo: "usuario",
      token_verificacion,
      creado: admin.firestore.FieldValue.serverTimestamp(),
      expira_en: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      ),
    });
  }

  async crearTramitePendienteContrasena(
    usuario_id,
    correo,
    token_verificacion
  ) {
    return await db.collection("tramites_pendientes").add({
      usuario_id,
      correo,
      token_verificacion,
      creado: admin.firestore.FieldValue.serverTimestamp(),
      expira_en: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 1 * 60 * 60 * 1000)
      ),
    });
  }

  async crearAutenticacion(email, nombre) {
    return await admin.auth().createUser({
      email,
      displayName: nombre,
      emailVerified: false,
    });
  }

  async crearTramitePendiente_Renovacion(
    usuario_id,
    negocio_id,
    price_id,
    membresia
  ) {
    return await db.collection("tramites_pendientes").add({
      usuario_id,
      negocio_id,
      price_id,
      membresia,
      renovacion: true,
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async obtenerTramitePendiente(tramite_id) {
    const docRef = await db
      .collection("tramites_pendientes")
      .doc(tramite_id)
      .get();

    return docRef;
  }

  async procesandoTramiteNegocio(tramite_id, negocioId, usuarioId) {
    const refDoc = db.collection("tramites_pendientes").doc(tramite_id);

    await refDoc.update({
      contrasena: admin.firestore.FieldValue.delete(),
      correo: admin.firestore.FieldValue.delete(),
      usuario: admin.firestore.FieldValue.delete(),
      negocio_id: negocioId,
      usuario_id: usuarioId,
      procesado: true,
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async tramiteConcluido(tramite_id) {
    await db.collection("tramites_pendientes").doc(tramite_id).delete();
  }

  // Este metodo funciona para los tramites pendientes, no para los tramites que ya se encuentran en proceso
  // Los tramites que ya se encuentran en proceso no contienen el nombre del usuario...
  async existeTramiteUsuario(usuario) {
    const enTramite = await db
      .collection("tramites_pendientes")
      .where("usuario", "==", usuario)
      .limit(1)
      .get();

    return !enTramite.empty;
  }
}

export default Modelo_Tramites_Pendientes;
