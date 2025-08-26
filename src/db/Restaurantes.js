const { admin, db } = require("../../Configuraciones");

class Modelo_Restaurante {
  async obtenerRestaurante(restauranteId = "") {
    return await db.collection("restaurantes").doc(restauranteId).get();
  }

  async obtenerRestauranteRK(randomKey = Number) {
    return await db
      .collection("restaurantes")
      .where("randomKey", "==", randomKey)
      .limit(1)
      .get();
  }

  async restauranteDeUsuario(usuarioId) {
    const restSnap = await db
      .collection("restaurantes")
      .where("usuarioId", "==", usuarioId)
      .limit(1)
      .get();

    return restSnap;
  }

  async actualizarRestaurante(restauranteId, datos) {
    await db
      .collection("restaurantes")
      .doc(restauranteId)
      .update({
        ...datos,
        actualizado: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  async tamanoConsultaOrdenada(tamano = Int32Array, esDesc = true) {
    // Posibilidad de añadir algunos filtros como parametros
    return db
      .collection("restaurantes")
      .orderBy("randomKey", esDesc ? "desc" : "asc")
      .limit(tamano);
  }

  async totalDeRestaurantes() {
    return (await db.collection("restaurantes").count().get()).data().count;
  }

  async posicionActual(restauranteId = "", orden = "") {
    return (
      await db
        .collection("restaurantes")
        .orderBy("creado", orden)
        .endBefore(restauranteId)
        .count()
        .get()
    ).data().count;
  }

  async crearRestaurante(usuarioId, correo, telefono, tamano) {
    const restauranteRef = await db.collection("restaurantes").add({
      usuarioId,
      correo,
      telefono,
      tamano,
      activo: true,
      randomKey: Math.random(),
      creado: admin.firestore.Timestamp.now(),
    });

    return restauranteRef;
  }
}

module.exports = Modelo_Restaurante;
