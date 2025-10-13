const { admin, db } = require("../../Configuraciones");

class Sugerencias {
  async crearSugerencia(
    titulo,
    descripcion,
    importancia,
    negocioId,
    negocioNombre,
    propietarioCorreo,
    propietarioNombre
  ) {
    return db.collection("sugerencias").add({
      titulo,
      descripcion,
      importancia,
      negocioId,
      negocioNombre,
      propietarioCorreo,
      propietarioNombre,
      progreso: 0,
      creado: admin.firestore.FieldValue.serverTimestamp(),
      actualizado: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async obtenerSugerencias(todas = true, negocioId) {
    var consulta;
    if (todas) consulta = db.collection("sugerencias");
    else if (negocioId)
      consulta = db
        .collection("sugerencias")
        .where("negocio_id", "==", negocioId);

    return await consulta.get();
  }

  async patchSugerencia(sugerenciaId, datos) {
    await db
      .collection("sugerencias")
      .doc(sugerenciaId)
      .update({
        actualizado: admin.firestore.FieldValue.serverTimestamp(),
        ...datos,
      });
  }

  async borrarSugerencia(sugerenciaId) {
    await db.collection("sugerencias").doc(sugerenciaId).delete();
  }
}

module.exports = Sugerencias;
