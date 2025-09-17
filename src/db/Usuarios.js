const { admin, db } = require("../../Configuraciones");

class Modelo_Usuario {
  async nombreExiste(usuarioNombre) {
    const usuarioExistente = await db
      .collection("usuarios")
      .where("usuario", "==", usuarioNombre)
      .get();

    return !usuarioExistente.empty;
  }

  async correoExiste(usuarioCorreo) {
    const correoExistente = await db
      .collection("usuarios")
      .where("correo", "==", usuarioCorreo)
      .get();

    return !correoExistente.empty;
  }

  async registrarUsuario(usuario, contrasena, correo, tipo) {
    const docRef = await db.collection("usuarios").add({
      usuario,
      contrasena,
      correo,
      tipo,
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });

    return docRef;
  }

  async usuario(correo) {
    const snapshot = await db
      .collection("usuarios")
      .where("correo", "==", correo)
      .limit(1)
      .get();

    return !snapshot.empty
      ? {
          usuario: snapshot.docs[0].data(),
          usuarioId: snapshot.docs[0].id,
        }
      : null;
  }
}

module.exports = Modelo_Usuario;
