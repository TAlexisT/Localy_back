const { admin, db } = require("../db/Configuraciones");

class Modelo_Restaurante {
  async RestauranteDeUsuario(usuarioId) {
    const restSnap = await db
      .collection("restaurantes")
      .where("usuarioId", "==", usuarioId)
      .limit(1)
      .get();

      return restSnap;
  }
}

module.exports = Modelo_Restaurante;
