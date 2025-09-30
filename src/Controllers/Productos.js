const Modelo_Productos = require("../db/Productos");
const Modelo_Negocio = require("../db/Negocios");
const Servicios_Productos = require("../Services/ServiciosProductos");

const { esquemaProductoUpload } = require("../Schemas/Productos");
const { validador } = require("../Validators/Validador");

class Controlador_Productos {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloProducto;
  #modeloNegocio;
  #serviciosProducto;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloProducto = new Modelo_Productos();
    this.#modeloNegocio = new Modelo_Negocio();
    this.#serviciosProducto = new Servicios_Productos();
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

    const { nombre, precio, categoria, descripcion, en_oferta } =
      validacion.datos;

    try {
      // Creación del producto en la base de datos
      const productoId = await this.#modeloProducto.crearProducto(
        nombre,
        null, // La URL de la imagen se asignará después de subir la imagen
        precio,
        categoria,
        descripcion,
        en_oferta,
        req.negocio_id // El objeto req.negocio_id es asignado por el middleware de validación de usuario y negocio
      );

      const estado = await this.#serviciosProducto.subirImagenProducto(
        req.file,
        productoId.id,
        req.negocio_id,
        req.usuario.id
      );

      // Actualizar el producto con la URL de la imagen subida
      if (estado.exito)
        await this.#modeloProducto.patchProducto(productoId.id, {
          imagen_URL: estado.url,
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
    try {
    const { id } = req.params;
    if (!id)
      return res.status(400).json({
        exito: false,
        mensaje:
          "El ID del restaurante al que pertenece el producto no fue proporcionado.",
      });
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

  obtenerProductosNegocio = async (req, res) => {
    try {
      const { negocio_id } = req.params;

      if (!negocio_id) {
        return res.status(400).json({
          exito: false,
          mensaje:
            "No se especificó el id del negocio dentro de los parametros en la url",
        });
      }

      const productosSnap = await this.#modeloProducto.obtenerProductosNegocio(
        negocio_id
      );

      if (productosSnap.empty) {
        return res.status(200).json({
          exito: true,
          datos: [],
          mensaje: "No hay productos registrados para este negocio",
        });
      }

      const datos = productosSnap.docs.map((doc) => {
        const { nombre, en_oferta, imagen_URL, precio, producto_id } =
          doc.data();

        return {
          producto_id: doc.id,
          ...{ nombre, en_oferta, imagen_URL, precio, producto_id },
        };
      });

      return res.status(200).json({
        exito: true,
        datos: datos,
      });
    } catch (err) {
      console.error("Ocurrio un error al obtener el producto:", err);
      return res.status(500).json({
        exito: false,
        mensaje: "Ocurrio un error dendtro del servidor",
      });
    }
  };

  paginacionProductos = async (req, res) => {
    try {
      const pagParams = validador(
        {
          tamano: req.body.pageSize,
          seed: req.body.seed,
          cursor: req.body.cursor,
          direccion: req.body.direction,
        },
        paginacionParams
      );

      if (!pagParams.exito) return res.status(400).json(pagParams);

      const pagFiltros = validador(
        {
          general: req.body.general,
          categoria: req.body.categoria,
          precio_orden: req.body.precio_orden,
          precio_rango: req.body.precio_rango,
        },
        paginacionFiltros
      );
      if (!pagFiltros.exito) return res.status(400).json(pagParams);

      const { tamano, cursor, direccion, seed } = pagParams.datos;
      const { general, categoria, precio_orden, precio_rango } =
        pagFiltros.datos;
      var respuesta = {};

      respuesta = this.#serviciosProducto.paginacionProducto(
        tamano,
        direccion,
        cursor,
        seed,
        general,
        categoria,
        precio_orden,
        precio_rango
      );
    } catch (err) {
      console.error("Error en paginación:", err);
      res.status(500).json({ error: "Error del servidor" });
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

      const estado = await this.#serviciosProducto.subirImagenProducto(
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
}

module.exports = Controlador_Productos;
