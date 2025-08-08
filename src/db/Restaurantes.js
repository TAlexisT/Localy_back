const { admin, db } = require("../db/Configuraciones");

class Modelo_Restaurante {
  async obtenerRestaurante(restauranteId) {
    return await db.collection("restaurantes").doc(restauranteId).get();
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

  async tamanoConsulta(tamano){
    // Posibilidad de añadir algunos filtros como parametros
    return db
        .collection("restaurantes")
        .orderBy("creado", "desc")
        .limit(tamano)
  }
}

module.exports = Modelo_Restaurante;
