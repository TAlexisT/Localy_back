const Modelo_Producto = require("../db/Productos");
const Modelo_Negocio = require("../db/Negocios");
const Modelo_Usuario = require("../db/Usuarios");
const Servicios_Productos = require("../Services/ServiciosProductos");
const Servicios_Generales = require("../Services/ServiciosGenerales");

const {
  esquemaProductoUpload,
  paginacionFiltros,
  paginacionParams,
} = require("../Schemas/Productos");
const { validador } = require("../Validators/Validador");

class Controlador_Productos {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloProducto;
  #modeloNegocio;
  #modeloUsuario;
  #serviciosProducto;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloProducto = new Modelo_Producto();
    this.#modeloNegocio = new Modelo_Negocio();
    this.#modeloUsuario = new Modelo_Usuario();
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
      const negocioSnap = await this.#modeloNegocio.obtenerNegocio(
        req.negocio_id
      );

      const negocioDatos = negocioSnap.data();

      // Creación del producto en la base de datos
      const productoId = await this.#modeloProducto.crearProducto(
        nombre,
        null, // La URL de la imagen se asignará después de subir la imagen
        precio,
        categoria,
        descripcion,
        en_oferta,
        req.negocio_id, // El objeto req.negocio_id es asignado por el middleware de validación de usuario y negocio
        negocioDatos.nombre,
        negocioDatos.ubicacion
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
          imagen_URL: { url: estado.url, ruta: estado.ruta },
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
      var esFavorito = false;

      if (!id)
        return res.status(400).json({
          exito: false,
          mensaje:
            "El ID del restaurante al que pertenece el producto no fue proporcionado.",
        });
      const productoSnap = await this.#modeloProducto.obtenerProducto(id);

      if (req.usuario?.id) {
        var usuario = await this.#modeloUsuario.obtenerUsuario(req.usuario.id);
        usuario = usuario.data();

        esFavorito = usuario.productos_favoritos?.includes(id) || false;
      }

      if (!productoSnap.exists)
        return res
          .status(404)
          .json({ exito: false, mensaje: "Producto no encontrado" });

      const { creado, activo, actualizado, random_key, ...demasDatos } =
        productoSnap.data();

      demasDatos.imagen_URL = Servicios_Generales.soloURL(
        demasDatos.imagen_URL
      );
      demasDatos["esFavorito"] = esFavorito;

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
        var { nombre, en_oferta, imagen_URL, precio } = doc.data();
        imagen_URL = Servicios_Generales.soloURL(imagen_URL);

        return {
          producto_id: doc.id,
          ...{ nombre, en_oferta, imagen_URL, precio },
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
          direccion: req.body.direccion,
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

      respuesta = await this.#serviciosProducto.paginacionProducto(
        tamano,
        direccion,
        cursor,
        seed,
        general,
        categoria,
        precio_orden,
        precio_rango
      );

      return res.status(200).json({ exito: true, ...respuesta });
    } catch (err) {
      console.error("Error en paginación:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  actualizarProducto = async (req, res) => {
    try {
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

      const { nombre, precio, categoria, descripcion, en_oferta } =
        validacion.datos;

      await this.#modeloProducto.patchProducto(id, {
        nombre,
        precio,
        categoria,
        descripcion,
        en_oferta,
      });

      const estado = await this.#serviciosProducto.subirImagenProducto(
        req.file,
        id,
        req.negocio_id,
        req.usuario.id
      );

      if (estado.exito) {
        const productoSnap = await this.#modeloProducto.obtenerProducto(id);
        const productoDatos = productoSnap.data();

        if (productoDatos.imagen_URL?.ruta)
          await Servicios_Generales.borrarRuta(
            productoDatos.imagen_URL?.ruta,
            false
          );

        await this.#modeloProducto.patchProducto(id, {
          imagen_URL: { url: estado.url, ruta: estado.ruta },
        });
      } else if (req.file) console.warn(`No se pudo subir la imagen`, estado);

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
    try {
      // Lógica para eliminar un producto (a implementar)
      const { id } = req.params;
      if (!id)
        return res.status(400).json({
          exito: false,
          mensaje: "El ID del producto no fue proporcionado.",
        });

      const productoSnap = await this.#modeloProducto.obtenerProducto(id);
      const productoDatos = productoSnap.data();

      if (productoDatos.imagen_URL?.ruta)
        await Servicios_Generales.borrarRuta(
          productoDatos.imagen_URL?.ruta,
          false
        );

      await this.#modeloProducto.eliminarProducto(id);
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
