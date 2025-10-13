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
    if (negocioIds.length == 0) return null;
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

  /**
   * Recupera un número limitado de documentos de la colección "negocios", ordenados por el campo "random_key".
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
      .orderBy("random_key", esDesc ? "desc" : "asc")
      .limit(tamano);
  }

  async renovarSubscripcion(negocioId, price_id, customerId) {
    await db.collection("negocios").doc(negocioId).update({
      activo: true,
      stripe: {
        customerId,
        price_id,
      },
      pago_fecha: admin.firestore.FieldValue.serverTimestamp(),
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
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
      pago_fecha: admin.firestore.FieldValue.serverTimestamp(),
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
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
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
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
      menus: {},
      random_key: Math.random(),
      pago_fecha: admin.firestore.FieldValue.serverTimestamp(),
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async subirMenu(negocioId, menuURL, menuRuta) {
    const id = Math.random().toString(36).substring(2, 11);

    // Crear una instancia de los datos a actualizar
    const updateData = {
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Insertamos el nuevo campo de menus
    updateData[`menus.${id}`] = { url: menuURL, ruta: menuRuta };

    await db.collection("negocios").doc(negocioId).update(updateData);
  }

  async eliminarMenu(negocioId, menuId) {
    const menuLink = `menus.${menuId}`;
    await db
      .collection("negocios")
      .doc(negocioId)
      .update({
        actualizado: admin.firestore.FieldValue.serverTimestamp(),
        [menuLink]: admin.firestore.FieldValue.delete(),
      });
  }
}

module.exports = Modelo_Negocio;
