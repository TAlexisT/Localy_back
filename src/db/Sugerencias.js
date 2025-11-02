import { admin, db } from "../../Configuraciones.js";

class Sugerencias {
  async crearSugerencia(
    titulo,
    descripcion,
    negocioId,
    negocioNombre,
    propietarioCorreo,
    propietarioNombre
  ) {
    return db.collection("sugerencias").add({
      titulo,
      descripcion,
      negocio_id: negocioId,
      negocio_nombre: negocioNombre,
      propietario_correo: propietarioCorreo,
      propietario_nombre: propietarioNombre,
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

export default Sugerencias;
