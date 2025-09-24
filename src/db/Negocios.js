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

  async consultaBase() {
    return db.collection("negocios");
  }

  async obtenerPropietario(negocio_id = string) {
    const restSnap = await db.collection("negocios").doc(negocio_id).get();

    if (!restSnap.exists) return null;
    else return restSnap.data().usuarioId;
  }

  async obtenerLista(negocioIds) {
    return await db
      .collection("negocios")
      .where(admin.firestore.FieldPath.documentId(), "in", negocioIds)
      .get();
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
        ubicacion: {
          latitude: ubicacion.latitude,
          longitude: ubicacion.longitude,
        },
        ...demasDatos,
        actualizado: admin.firestore.Timestamp.now(),
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
        actualizado: admin.firestore.Timestamp.now(),
      });
  }

  /**
   * Recupera un número limitado de documentos de la colección "negocios", ordenados por el campo "randomKey".
   *
   * @param {number} [tamano=Int32Array] - El número máximo de documentos a recuperar.
   * @param {boolean} [esDesc=true] - Si ordenar los resultados en orden descendente (verdadero) o ascendente (falso).
   * @returns {Promise<Query>} Una promesa que resuelve la consulta con el orden especificado y el límite aplicado.
   */
  async tamanoConsultaOrdenada(tamano, esDesc = true) {
    // Posibilidad de añadir algunos filtros como parametros
    return db
      .collection("negocios")
      .where("activo", "==", true)
      .where("nombre", ">=", " ")
      .orderBy("randomKey", esDesc ? "desc" : "asc")
      .limit(tamano);
  }

  async renovarSubscripcion(negocioId, price_id, customerId) {
    await db.collection("negocios").doc(negocioId).update({
      activo: true,
      stripe: {
        customerId,
        price_id,
      },
      pago_fecha: admin.firestore.Timestamp.now(),
      actualizado: admin.firestore.Timestamp.now(),
    });
  }

  async refrescarSubscripcion(customerId) {
    const negocioSnap = await db
      .collection("negocios")
      .where("stripe.customerId", "==", customerId)
      .limit(1)
      .get();
    if (negocioSnap.empty) return;
    const negocioRef = negocioSnap.docs[0].ref;
    await negocioRef.update({
      activo: true,
      pago_fecha: admin.firestore.Timestamp.now(),
      actualizado: admin.firestore.Timestamp.now(),
    });
  }

  async desactivarSubscripcion(customerId) {
    const negocioSnap = await db
      .collection("negocios")
      .where("stripe.customerId", "==", customerId)
      .limit(1)
      .get();
    if (negocioSnap.empty) return;
    const negocioRef = negocioSnap.docs[0].ref;
    await negocioRef.update({
      activo: false,
      actualizado: admin.firestore.Timestamp.now(),
    });
  }

  async crearNegocio(usuarioId, correo, telefono, price_id, customer_id) {
    return await db.collection("negocios").add({
      usuarioId,
      correo,
      telefono,
      activo: true,
      stripe: {
        customer_id,
        price_id,
      },
      randomKey: Math.random(),
      pago_fecha: admin.firestore.Timestamp.now(),
      creado: admin.firestore.Timestamp.now(),
    });
  }
}

module.exports = Modelo_Negocio;
