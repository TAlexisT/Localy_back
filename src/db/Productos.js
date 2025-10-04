const { number, string } = require("joi");
const { admin, db } = require("../../Configuraciones");

class Productos {
  async crearProducto(
    nombre,
    imagen_URL,
    precio,
    categoria,
    descripcion,
    en_oferta,
    negocio_id,
    nombre_negocio
  ) {
    return db.collection("productos").add({
      nombre,
      precio,
      categoria,
      descripcion,
      imagen_URL,
      negocio_id,
      en_oferta,
      nombre_negocio,
      activo: true,
      random_key: Math.random(),
      creado: admin.firestore.Timestamp.now(),
    });
  }

  async obtenerProducto(productoId) {
    return await db.collection("productos").doc(productoId).get();
  }

  async obtenerProductosNegocio(negocioId) {
    return await db
      .collection("productos")
      .where("negocio_id", "==", negocioId)
      .where("activo", "==", true)
      .get();
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

  async tamanoConsultaOrdenada(
    tamano,
    porPrecio = false,
    orden = "desc",
    categoria = null,
    precioRango = null
  ) {
    var consulta = db
      .collection("productos")
      .where("activo", "==", true)
      .orderBy(porPrecio ? "precio" : "random_key", orden)
      .limit(tamano);

    if (categoria) consulta = consulta.where("categoria", "==", categoria);

    if (precioRango)
      consulta = consulta
        .where("precio", ">=", precioRango[0])
        .where("precio", "<=", precioRango[1]);

    return consulta;
  }
}

module.exports = Productos;
