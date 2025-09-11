const { number, string } = require("joi");
const { admin, db } = require("../../Configuraciones");

class Modelo_Negocio {
  /**
   * Obtiene un negocio por su ID desde Firestore.
   *
   * @param {string} negocioId - ID del negocio que se desea recuperar.
   * @returns {Promise<FirebaseFirestore.DocumentSnapshot>}
   *          Una promesa que se resuelve con el snapshot del documento.
   *          Usa `doc.exists` para verificar si el documento fue encontrado.
   */
  async obtenerNegocio(negocioId) {
    return await db.collection("negocios").doc(negocioId).get();
  }

  /**
   * Obtiene un negocio a partir de su `randomKey`.
   *
   * ⚠️ Nota: este método devuelve un `QuerySnapshot` que puede estar vacío
   *          si no existe ningún negocio con la clave indicada.
   *
   * @param {number} randomKey - Valor de la clave aleatoria asociada al negocio.
   * @returns {Promise<FirebaseFirestore.QuerySnapshot>}
   *          Una promesa que se resuelve con un snapshot de la consulta,
   *          que contendrá como máximo un documento.
   */
  async obtenerNegocioRK(randomKey = Number) {
    return await db
      .collection("negocios")
      .where("randomKey", "==", randomKey)
      .limit(1)
      .get();
  }

  async obtenerPropietario(id = string) {
    const restSnap = await db.collection("negocios").doc(id).get();

    if (!restSnap.exists) return null;
    else return restSnap.data().usuarioId;
  }

  async negocioDeUsuario(usuarioId) {
    const restSnap = await db
      .collection("negocios")
      .where("usuarioId", "==", usuarioId)
      .limit(1)
      .get();

    return restSnap;
  }

  async actualizarNegocio(negocioId, datos) {
    const { ubicacion, ...demasDatos } = datos;
    await db
      .collection("negocios")
      .doc(negocioId)
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
   * Actualiza campos específicos de un negocio en Firestore.
   *
   * ⚠️ Importante: este método no valida el contenido del objeto `datos`.
   *    Asegúrate de sanitizar y validar los valores antes de invocarlo
   *    para evitar sobrescribir campos no deseados.
   *
   * @param {string} negocioId - ID del negocio que se desea actualizar.
   * @param {Object} datos - Objeto con los campos a actualizar en el documento.
   *                         Solo los campos presentes en este objeto serán modificados.
   *                         Los demás permanecen sin cambios.
   * @returns {Promise<void>} Una promesa que se resuelve cuando la actualización finaliza.
   */
  async patchNegocio(negocioId, datos) {
    await db
      .collection("negocios")
      .doc(negocioId)
      .update({
        ...datos,
        actualizado: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  async reactivarNegocio(negocioId) {
    await db.collection("negocios").doc(negocioId).update({
      pago_fecha: admin.firestore.FieldValue.serverTimestamp(),
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async tamanoConsultaOrdenada(tamano = Int32Array, esDesc = true) {
    // Posibilidad de añadir algunos filtros como parametros
    return db
      .collection("negocios")
      .orderBy("randomKey", esDesc ? "desc" : "asc")
      .limit(tamano);
  }

  async totalDeNegocios() {
    return (await db.collection("negocios").count().get()).data().count;
  }

  async posicionActual(negocioId = "", orden = "") {
    return (
      await db
        .collection("negocios")
        .orderBy("creado", orden)
        .endBefore(negocioId)
        .count()
        .get()
    ).data().count;
  }

  async crearNegocio(usuarioId, correo, telefono, tamano) {
    const negocioRef = await db.collection("negocios").add({
      usuarioId,
      correo,
      telefono,
      tamano,
      activo: true,
      randomKey: Math.random(),
      creado: admin.firestore.Timestamp.now(),
    });

    return negocioRef;
  }
}

module.exports = Modelo_Negocio;
