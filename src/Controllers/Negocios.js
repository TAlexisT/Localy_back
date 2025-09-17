const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Negocio = require("../db/Negocios");
const Modelo_Tramites_Pendientes = require("../db/Tramites_Pendientes");
const Interaccion_Stripe = require("../ThirdParty/Stripe");
const Servicios_Negocios = require("../Services/ServiciosNegocios");

const bcrypt = require("bcrypt");

const {
  esquemaPropietario,
  esquemaNegocio,
  paginacionFiltros,
  paginacionParams,
} = require("../Schemas/Negocios");
const { validador } = require("../Validators/Validador");

const { front_URL, hashSaltRounds } = require("../../Configuraciones");

class Controlador_Negocio {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloNegocio;
  #modeloTramitesPendientes;
  #interaccionStripe;
  #serviciosNegocios;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloNegocio = new Modelo_Negocio();
    this.#modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
    this.#interaccionStripe = new Interaccion_Stripe();
    this.#serviciosNegocios = new Servicios_Negocios();
  }

  obtenerNegocio = async (req, res) => {
    const { id } = req.params;

    if (!id)
      return req.status(400).json({
        error:
          "Es obligatorio añadir un id de negocio en el cuerpo de la petición",
      });

    try {
      const doc = await this.#modeloNegocio.obtenerNegocio(id);

      if (!doc.exists)
        return res.status(404).json({ error: "Negocio no encontrado" });

      const {
        randomKey,
        usuarioId,
        creado,
        actualizado,
        tamano,
        ...otrosDatos
      } = doc.data();

      res.status(200).json({ exito: true, datos: otrosDatos });
    } catch (err) {
      console.error("Error al obtener negocio:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  actualizarPerfil = async (req, res) => {
    const { negocio_id } = req.params;

    const validacion = validador(req.body, esquemaNegocio);

    if (!validacion.exito) {
      return res.status(400).send({
        exito: validacion.exito,
        mensaje: validacion.mensaje,
        errores: validacion.errores,
      });
    }

    if (!negocio_id) {
      return res.status(400).json({ error: "ID de negocio no proporcionado." });
    }

    try {
      const svgContenido = req.file.buffer.toString("utf8") ?? "";

      if (svgContenido.includes("<svg") && svgContenido.includes("</svg>"))
        validacion.datos.logo = svgContenido;

      await this.#modeloNegocio.actualizarNegocio(negocio_id, validacion.datos);

      res
        .status(200)
        .json({ exito: true, message: "Perfil guardado correctamente" });
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      res.status(500).json({ error: "Error al guardar el perfil" });
    }
  };

  paginacionNegocios = async (req, res) => {
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
        proximidad: req.body.proximidad,
        general: req.body.general,
        usuario_locacion: req.body.usuario_locacion,
      },
      paginacionFiltros
    );
    if (!pagFiltros.exito) return res.status(400).json(pagParams);

    const { usuario_locacion, ...filtros } = pagFiltros.datos;
    const { tamano, cursor, direccion, seed } = pagParams.datos;
    var respuesta = {};

    /**
     * id
     * nombre,
     * distancia,
     * logo
     */

    try {
      if (
        filtros.categoria ||
        filtros.proximidad ||
        filtros.precio ||
        filtros.precio_rango ||
        filtros.general
      )
        respuesta = await this.#serviciosNegocios.paginacionNegocios_filtros(
          filtros,
          usuario_locacion,
          pagParams.datos.tamano,
          pagParams.datos.cursor,
          pagParams.datos.direccion
        );
      else
        respuesta = await this.#serviciosNegocios.paginacionNegocios_alazar(
          tamano,
          seed,
          usuario_locacion,
          cursor,
          direccion
        );

      respuesta.datos = respuesta.datos.map((negocio) => {
        return {
          negocio_id: negocio.negocio_id ?? null,
          nombre: negocio.nombre ?? null,
          distancia: negocio.distancia ?? null,
          logo: negocio.logo ?? null,
          descripcion: negocio.descripcion ?? null,
        };
      });

      res.status(200).json({
        seed, // Return the seed for consistent pagination
        ...respuesta,
      });
    } catch (error) {
      console.error("Error en paginación:", error);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  negocioRegistro = async (req, res) => {
    const { recurrente } = req.body;
    const validacion = validador(req.body, esquemaPropietario);

    if (!validacion.exito) {
      return res.status(400).send({
        exito: false,
        mensaje: validacion.mensaje,
        errores: validacion.errores,
      });
    }

    const { price_id, correo, contrasena, telefono, usuario } =
      validacion.datos;

    var tramitePendienteRef = null;

    try {
      if (
        (await this.#modeloUsuario.nombreExiste(usuario)) ||
        (await this.#modeloUsuario.correoExiste(correo)) ||
        (await this.#modeloTramitesPendientes.existeTramiteUsuario(usuario))
      )
        return res.status(403).json({
          exito: false,
          error:
            "El nombre de usuario o el correo electrónico o ambos ya están en uso.",
        });
      tramitePendienteRef =
        await this.#modeloTramitesPendientes.crearTramitePendiente(
          price_id,
          correo,
          await bcrypt.hash(contrasena, hashSaltRounds),
          telefono,
          usuario,
          false
        );

      const session = await this.#interaccionStripe.crearSession(
        price_id,
        { tramiteId: tramitePendienteRef.id },
        `${front_URL}/pago-exito?tramite_id=${tramitePendienteRef.id}`, // enfoque para "live"
        `${front_URL}/pago-error`, // enfoque para "live"
        recurrente ?? false
      );

      return res.status(202).json({ exito: true, url: session.url });
    } catch (err) {
      console.error("El metodo fallo al crear una nueva sesion: ", err);
      if (tramitePendienteRef.id)
        this.#modeloTramitesPendientes.tramiteConcluido(tramitePendienteRef.id);
      return res.status(500).json({
        exito: false,
        error: "No se pudo concretar el tramite.",
      });
    }
  };

  negocioPriceRenovacion = async (req, res) => {
    const { negocio_id } = req.params;
    if (!negocio_id)
      return res.status(400).json({
        exito: false,
        error: "El ID del negocio es requerido en los parametros de la URL.",
      });

    try {
      tramitePendienteRef =
        await this.#modeloTramitesPendientes.crearTramitePendiente_Renovacion(
          negocio_id
        );

      const session = await this.#interaccionStripe.crearSession(
        price_id,
        { tramiteId: tramitePendienteRef.id },
        `${front_URL}/renovacion-exito?tramite_id=${tramitePendienteRef.id}`, // enfoque para "live"
        `${front_URL}/renovacion-error`, // enfoque para "live"
        recurrente ?? false
      );

      return res.status(202).json({ exito: true, url: session.url });
    } catch (err) {
      console.error("Error al renovar la subscripcion:", err);
      res
        .status(500)
        .json({ exito: false, error: "Error al renovar la subscripcion" });
    }
  };
}

module.exports = Controlador_Negocio;
