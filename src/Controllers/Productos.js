const Modelo_Productos = require("../db/Productos");
const Modelo_Negocio = require("../db/Negocios");
const { bucket } = require("../../Configuraciones");

const { esquemaProductoUpload } = require("../Schemas/Productos");
const { validador } = require("../Validators/Validador");

class Controlador_Productos {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloProducto;
  #modeloNegocio;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloProducto = new Modelo_Productos();
    this.#modeloNegocio = new Modelo_Negocio();
  }

  crearProducto = async (req, res) => {
    // Validación de datos entrantes de acuerdo al esquema definido
    const validacion = validador(req.body, esquemaProductoUpload);

    if (!validacion.exito)
      return res.status(400).json({
        exito: validacion.exito,
        mensaje: validacion.mensaje,
        error: validacion.errores,
      });

    const { nombre, precio, categoria, descripcion } = validacion.datos;

    try {
      // Creación del producto en la base de datos
      const productoId = await this.#modeloProducto.crearProducto(
        nombre,
        null, // La URL de la imagen se asignará después de subir la imagen
        precio,
        categoria,
        descripcion,
        req.negocio_id // El objeto req.negocio_id es asignado por el middleware de validación de usuario y negocio
      );

      const estado = await this.#subirImagenProducto(
        req.file,
        productoId.id,
        req.negocio_id,
        req.usuario.id
      );

      // Actualizar el producto con la URL de la imagen subida
      if (estado.exito)
        await this.#modeloProducto.patchProducto(productoId.id, {
          imagenURL: estado.url,
        });

      // Respuesta exitosa con el ID del nuevo producto creado
      return res
        .status(201)
        .json({ exito: true, data: { producto_id: productoId.id } });
    } catch (err) {
      // Manejo de errores y respuesta al cliente
      console.error("Error al crear producto:", err);
      return res
        .status(500)
        .json({ exito: false, mensaje: "Error del servidor." });
    }
  };

  obtenerProducto = async (req, res) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        exito: false,
        mensaje:
          "El ID del restaurante al que pertenece el producto no fue proporcionado.",
      });
    try {
      const productoSnap = await this.#modeloProducto.obtenerProducto(id);
      if (!productoSnap.exists)
        return res
          .status(404)
          .json({ exito: false, mensaje: "Producto no encontrado" });

      const { creado, ...demasDatos } = productoSnap.data();
      return res.status(200).json({ exito: true, datos: demasDatos });
    } catch (err) {
      console.error("Error al obtener producto:", err);
      return res
        .status(500)
        .json({ exito: false, mensaje: "Error del servidor." });
    }
  };

  actualizarProducto = async (req, res) => {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        exito: false,
        mensaje: "El ID del producto no fue proporcionado.",
      });
    const validacion = validador(req.body, esquemaProductoUpload);
    if (!validacion.exito)
      return res.status(400).json({
        exito: validacion.exito,
        mensaje: validacion.mensaje,
        error: validacion.errores,
      });

    const { nombre, precio, categoria, descripcion } = validacion.datos;

    try {
      _ = await this.#modeloProducto.actualizarProducto(
        id,
        nombre,
        precio,
        categoria,
        descripcion
      );

      const estado = await this.#subirImagenProducto(
        req.file,
        id,
        req.negocio_id,
        req.usuario.id
      );

      if (estado.exito)
        await this.#modeloProducto.patchProducto(id, { imagenURL: estado.url });

      return res
        .status(200)
        .json({ exito: true, mensaje: "Producto actualizado correctamente" });
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      return res
        .status(500)
        .json({ exito: false, mensaje: "Error del servidor." });
    }
  };

  eliminarProducto = async (req, res) => {
    // Lógica para eliminar un producto (a implementar)
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        exito: false,
        mensaje: "El ID del producto no fue proporcionado.",
      });

    try {
      _ = await this.#modeloProducto.eliminarProducto(id);
      return res
        .status(200)
        .json({ exito: true, mensaje: "Producto eliminado correctamente" });
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      return res
        .status(500)
        .json({ exito: false, mensaje: "Error del servidor." });
    }
  };

  /**
   * id,
   * nombre,
   * precio,
   * restaurante,
   * imagen
   */

  #subirImagenProducto = async (
    imagen,
    producto_id,
    negocio_id,
    usuario_id
  ) => {
    if (!imagen)
      return { exito: false, mensaje: "No se proporcionó ninguna imagen." };

    const nombreArchivo = `productos/usuario_${usuario_id}/negocio_${negocio_id}/producto_${producto_id}/${Date.now()}_${
      imagen.originalname
    }`;

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
          resolve({ exito: true, url: urlPublica });
        } catch (err) {
          console.log("Error al hacer la imagen pública:", err);
          reject({ exito: false, mensaje: "Error al procesar la imagen." });
        }
      });

      stream.end(imagen.buffer);
    });
  };
}

module.exports = Controlador_Productos;
