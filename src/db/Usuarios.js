const { admin, db } = require("../../Configuraciones");

class Modelo_Usuario {
  #coleccion;

  constructor() {
    this.#coleccion = db.collection("usuarios");
  }

  async obtenerUsuario(usuarioId) {
    return await this.#coleccion.doc(usuarioId).get();
  }

  async nombreExiste(usuarioNombre) {
    const usuarioExistente = await this.#coleccion
      .where("usuario", "==", usuarioNombre)
      .get();

    return !usuarioExistente.empty;
  }

  async correoExiste(usuarioCorreo) {
    const correoExistente = await this.#coleccion
      .where("correo", "==", usuarioCorreo)
      .get();

    return !correoExistente.empty;
  }

  async registrarUsuario(usuario, contrasena, correo, tipo) {
    const docRef = await this.#coleccion.add({
      usuario,
      contrasena,
      correo,
      tipo,
      negocios_favoritos: {},
      productos_favoritos: {},
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });

    return docRef;
  }

  async usuario(correo) {
    const snapshot = await this.#coleccion
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

  async borrarFavorito(usuarioId, favoritoLlave, esNegocio = true) {
    const llave = `${
      esNegocio ? "negocios" : "productos"
    }_favoritos.${favoritoLlave}`;

    await this.#coleccion.doc(usuarioId).update({
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
      [llave]: admin.firestore.FieldValue.delete(),
    });
  }

  async crearFavorito(usuarioId, favoritoId, esNegocio = true) {
    const campo = `${esNegocio ? "negocios" : "productos"}_favoritos`;
    const llave = Math.random().toString(36).substring(2, 11);

    const actualizacion = {
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save favoritoId under campo.llave
    actualizacion[`${campo}.${llave}`] = favoritoId;

    await this.#coleccion.doc(usuarioId).update(actualizacion);
  }
}

module.exports = Modelo_Usuario;
