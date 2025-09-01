const { admin, db } = require("../../Configuraciones");

class Modelo_Restaurante {
  /**
   * Obtiene un restaurante por su ID desde Firestore.
   *
   * @param {string} restauranteId - ID del restaurante que se desea recuperar.
   * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
   *          Una promesa que se resuelve con el snapshot del documento.
   *          Usa `doc.exists` para verificar si el documento fue encontrado.
   */
  async obtenerRestaurante(restauranteId) {
    return await db.collection("restaurantes").doc(restauranteId).get();
  }

  /**
   * Obtiene un restaurante a partir de su `randomKey`.
   *
   * ⚠️ Nota: este método devuelve un `QuerySnapshot` que puede estar vacío
   *          si no existe ningún restaurante con la clave indicada.
   *
   * @param {number} randomKey - Valor de la clave aleatoria asociada al restaurante.
   * @returns {Promise<FirebaseFirestore.QuerySnapshot>}
   *          Una promesa que se resuelve con un snapshot de la consulta,
   *          que contendrá como máximo un documento.
   */
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
    const { ubicacion, ...demasDatos } = datos;
    await db
      .collection("restaurantes")
      .doc(restauranteId)
      .update({
        ubicacion: new admin.firestore.GeoPoint(
          ubicacion.latitude,
          ubicacion.longitude
        ),
        ...demasDatos,
        actualizado: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Actualiza campos específicos de un restaurante en Firestore.
   *
   * ⚠️ Importante: este método no valida el contenido del objeto `datos`.
   *    Asegúrate de sanitizar y validar los valores antes de invocarlo
   *    para evitar sobrescribir campos no deseados.
   *
   * @param {string} restauranteId - ID del restaurante que se desea actualizar.
   * @param {Object} datos - Objeto con los campos a actualizar en el documento.
   *                         Solo los campos presentes en este objeto serán modificados.
   *                         Los demás permanecen sin cambios.
   * @returns {Promise<void>} Una promesa que se resuelve cuando la actualización finaliza.
   */
  async patchRestaurante(restauranteId, datos) {
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
