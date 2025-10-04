const Modelo_Producto = require("../db/Productos");

const { bucket } = require("../../Configuraciones");

class ServiciosProductos {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloProducto;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloProducto = new Modelo_Producto();
  }

  subirImagenProducto = async (imagen, producto_id, negocio_id, usuario_id) => {
    if (!imagen)
      return { exito: false, mensaje: "No se proporcionó ninguna imagen." };

    const nombreArchivo = `productos/usuario_${usuario_id}/negocio_${negocio_id}/producto_${producto_id}/${imagen.originalname}`;

    const archivo = bucket.file(nombreArchivo);
    const stream = archivo.createWriteStream({
      metadata: {
        contentType: imagen.mimetype,
        metadata: { usuario_id, negocio_id, producto_id },
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on("error", (err) => {
        console.log("Error al subir imagen:", err);
        reject({ exito: false, mensaje: "Error al subir la imagen." });
      });

      stream.on("finish", async () => {
        try {
          await archivo.makePublic();
          const urlPublica = `https://storage.googleapis.com/${bucket.name}/${nombreArchivo}`;
          resolve({ exito: true, url: urlPublica, nombreArchivo });
        } catch (err) {
          console.log("Error al hacer la imagen pública:", err);
          reject({ exito: false, mensaje: "Error al procesar la imagen." });
        }
      });

      stream.end(imagen.buffer);
    });
  };

  paginacionProducto = async (
    tamano,
    direccion,
    cursor,
    seed,
    general,
    categoria,
    precio_orden,
    precio_rango
  ) => {
    const ordenPorPrecio = !(precio_orden == "" || precio_orden == null);
    const precioRango = precio_rango
      ? precio_rango.split("-").map((item) => parseFloat(item.trim()))
      : null;

    var datos = [];
    var primerToken = null;
    var ultimoToken = null;
    var consulta;

    if (ordenPorPrecio) {
      if (typeof cursor !== "string") cursor = null;

      consulta = await this.#modeloProducto.tamanoConsultaOrdenada(
        tamano,
        true,
        precio_orden ? precio_orden.toLowerCase() : "asc",
        categoria,
        precioRango || null
      );

      if (cursor) {
        const cursorSnap = await this.#modeloProducto.obtenerProducto(cursor);

        if (!cursorSnap.exists)
          return {
            datos: [],
            primerToken: null,
            ultimoToken: null,
          };

        if (direccion == "siguiente")
          consulta = consulta.startAfter(cursorSnap);
        else if (direccion == "anterior")
          consulta = consulta.endBefore(cursorSnap);
      }

      const snapshot = await consulta.get();

      datos = this.#extraerDatos(snapshot);

      if (datos.length == 0)
        return {
          datos: [],
          primerToken: null,
          ultimoToken: null,
        };

      primerToken = datos[0].negocio_id;
      ultimoToken = datos[datos.length - 1].negocio_id;
    } else {
      if (typeof cursor !== "number") cursor = null;
      const avanza = direccion == "siguiente" || !cursor;

      consulta = await this.#modeloProducto.tamanoConsultaOrdenada(
        tamano,
        false,
        avanza ? "desc" : "asc",
        categoria,
        precioRango || null
      );

      if (!cursor || (cursor < seed && avanza) || (cursor > seed && !avanza)) {
        consulta = consulta.where(
          "random_key",
          avanza ? "<" : ">",
          !cursor ? seed : cursor
        );

        const snapshot = await consulta.get();

        datos = this.#extraerDatos(snapshot);

        if (datos.length < tamano) {
          consulta = await this.#modeloProducto.tamanoConsultaOrdenada(
            tamano - datos.length,
            false,
            avanza ? "desc" : "asc",
            categoria,
            precioRango
          );

          consulta = consulta.where("random_key", avanza ? ">" : "<", seed);

          const snapshotDespues = await consulta.get();

          datos = [...datos, ...this.#extraerDatos(snapshotDespues)];
        }
      } else {
        consulta = consulta
          .where("random_key", avanza ? "<" : ">", cursor)
          .where("random_key", avanza ? ">" : "<", seed);

        const snapshot = await consulta.get();
        datos = this.#extraerDatos(snapshot);
      }

      if (datos.length == 0)
        return {
          datos: [],
          primerToken: null,
          ultimoToken: null,
        };

      primerToken = datos[0].random_key;
      ultimoToken = datos[datos.length - 1].random_key;
    }

    // filtrado general
    if (general)
      datos = datos.filter(
        (prod) =>
          prod.nombre.toLowerCase().includes(general.toLowerCase()) ||
          prod.descripcion.toLowerCase().includes(general.toLowerCase())
      );

    return {
      datos,
      primerToken,
      ultimoToken,
    };
  };

  #extraerDatos = (snapshot) => {
    const datos = [];
    snapshot.forEach((doc) => {
      datos.push({ producto_id: doc.id, ...doc.data() });
    });

    return datos;
  };
}

module.exports = ServiciosProductos;
