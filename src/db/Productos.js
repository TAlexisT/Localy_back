const { number, string } = require("joi");
const { admin, db } = require("../../Configuraciones");

class Productos {
  async crearProducto(
    nombre,
    imagenURL,
    precio,
    categoria,
    descripcion,
    negocio_id
  ) {
    return db.collection("productos").add({
      nombre,
      precio,
      categoria,
      descripcion,
      negocio_id,
      creado: admin.firestore.Timestamp.now(),
    });
  }

  async obtenerProducto(productoId) {
    return await db.collection("prductos").doc(productoId).get();
  }

  async actualizarProducto(productoId, nombre, precio, categoria, descripcion) {
    return await db.collection("productos").doc(productoId).update({
      nombre,
      precio,
      categoria,
      descripcion,
      actualizado: admin.firestore.Timestamp.now(),
    });
  }

  async patchProducto(productoId, datos) {
    return await db
      .collection("productos")
      .doc(productoId)
      .update({
        ...datos,
        actualizado: admin.firestore.Timestamp.now(),
      });
  }

  async eliminarProducto(productoId) {
    return await db.collection("productos").doc(productoId).delete();
  }
}

module.exports = Productos;
