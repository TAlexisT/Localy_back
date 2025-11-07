import Modelo_Usuario from "../db/Usuarios.js";
import Modelo_Negocio from "../db/Negocios.js";
import Modelo_Tramites_Pendientes from "../db/Tramites_Pendientes.js";
import Interaccion_Stripe from "../ThirdParty/Stripe.js";
import Emails_ThirdParty from "../ThirdParty/Emails.js";
import Servicios_Negocios from "../Services/ServiciosNegocios.js";
import servs from "../Services/ServiciosGenerales.js";

import bcrypt from "bcrypt";
import crypto from "crypto";

import {
  esquemaPropietario,
  esquemaNegocio,
  paginacionFiltros,
  paginacionParams,
  renovacion,
} from "../Schemas/Negocios.js";
import { validador } from "../Validators/Validador.js";

import {
  front_URL,
  hashSaltRounds,
  transporter,
  smtp,
} from "../../Configuraciones.js";

class Controlador_Negocio {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloNegocio;
  #emails;
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
    this.#emails = new Emails_ThirdParty();
    this.#serviciosNegocios = new Servicios_Negocios();
  }

  obtenerNegocio = async (req, res) => {
    try {
      const { id } = req.params;
      var esFavorito = false;

      if (!id)
        return req.status(400).json({
          error:
            "Es obligatorio añadir un id de negocio en el cuerpo de la petición",
        });

      const doc = await this.#modeloNegocio.obtenerNegocio(id);

      if (req.usuario?.id) {
        var usuario = await this.#modeloUsuario.obtenerUsuario(req.usuario.id);
        usuario = usuario.data();

        esFavorito = usuario.negocios_favoritos?.includes(id) || false;
      }

      if (!doc.exists)
        return res
          .status(404)
          .json({ exito: false, mensaje: "Negocio no encontrado" });

      const {
        random_key,
        usuarioId,
        creado,
        actualizado,
        stripe,
        pago_fecha,
        ...otrosDatos
      } = doc.data();

      otrosDatos.menus = servs.soloURLs(otrosDatos.menus);
      otrosDatos.logo = servs.soloURL(otrosDatos.logo);
      otrosDatos["esFavorito"] = esFavorito;

      res.status(200).json({ exito: true, datos: otrosDatos });
    } catch (err) {
      console.error("Error al obtener negocio:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  obtenerCadaNegocio = async (req, res) => {
    try {
      var cadaNegocio = await this.#modeloNegocio.obtenerCadaNegocio();
      cadaNegocio = cadaNegocio.docs.map((doc) => {
        const {
          actualizado,
          creado,
          horario,
          menus,
          redes,
          ubicacion,
          random_key,
          stripe,
          logo,
          ...demasDatos
        } = doc.data();

        return {
          negocio_id: doc.id,
          logo: servs.soloURL(logo),
          ...demasDatos,
        };
      });

      return res.status(200).json({ exito: true, datos: cadaNegocio });
    } catch (err) {
      console.error("Error al obtener negocios:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  actualizarPerfil = async (req, res) => {
    try {
      const { negocio_id } = req.params;
      const { nombre, descripcion, borrar_logo, ubicacion, horario, redes } =
        req.body;

      // Validamos los datos entrantes.
      const validacion = validador(
        {
          nombre,
          descripcion,
          borrar_logo: borrar_logo === "true",
          ubicacion: JSON.parse(ubicacion),
          horario: JSON.parse(horario),
          redes: JSON.parse(redes),
        },
        esquemaNegocio
      );
      if (!validacion.exito)
        return res.status(400).send({
          exito: validacion.exito,
          mensaje: validacion.mensaje,
          errores: validacion.errores,
        });

      // Subimos la imagen proporcionada, en caso de no hacerlo, el método responderá con un {error: true ...}
      const subirImagen = await this.#serviciosNegocios.subirImagenNegocio(
        req.file,
        negocio_id,
        req.usuario.id,
        "logo"
      );

      var negocio = await this.#modeloNegocio.obtenerNegocio(negocio_id);
      negocio = negocio.data();

      // borrar imagen si ya existe una o simplemente no añadimos nada.
      if (subirImagen.exito) {
        const ruta = negocio.logo?.ruta;
        if (ruta) await servs.borrarRuta(ruta, false);
        validacion.datos.logo = {
          url: subirImagen.url,
          ruta: subirImagen.ruta,
        };
      } else if (validacion.datos.borrar_logo) {
        // En caso de borrar el logo, necesitamos resetear todas la referencias
        const { ruta } = negocio.logo;
        if (ruta) await servs.borrarRuta(ruta, false);
        validacion.datos.logo = { url: "", ruta: "" };
      }

      // Limpiamos datos no deseados para la base de datos
      delete validacion.datos.borrar_logo;
      await this.#modeloNegocio.actualizarNegocio(negocio_id, validacion.datos);
      res
        .status(200)
        .json({ exito: true, message: "Perfil guardado correctamente" });
    } catch (err) {
      // Manejamos los errores en caso de que ocurran.
      console.error("Error al guardar perfil:", err);
      res.status(500).json({ error: "Error al guardar el perfil" });
    }
  };

  paginacionNegocios = async (req, res) => {
    try {
      const pagParams = validador(
        {
          tamano: req.body.tamano,
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
          usuario_locacion: req.body.usuario_locacion,
          distancia_orden: req.body.distancia_orden,
          distancia_rango: req.body.distancia_rango,
          membresia: req.body.membresia,
        },
        paginacionFiltros
      );
      if (!pagFiltros.exito) return res.status(400).json(pagParams);

      const {
        usuario_locacion,
        distancia_orden,
        distancia_rango,
        general,
        membresia,
      } = pagFiltros.datos;
      const { tamano, cursor, direccion, seed } = pagParams.datos;
      var respuesta = {};

      respuesta = await this.#serviciosNegocios.paginacionNegocios_alazar(
        tamano,
        seed,
        general,
        usuario_locacion,
        distancia_orden,
        distancia_rango,
        membresia,
        cursor,
        direccion
      );

      respuesta.datos = respuesta.datos.map((negocio) => {
        return {
          negocio_id: negocio.negocio_id ?? null,
          nombre: negocio.nombre ?? null,
          distancia: negocio.distancia ?? null,
          logo: negocio.logo?.url ?? negocio.logo ?? null,
          random_key: negocio.random_key,
          descripcion: negocio.descripcion ?? null,
          distancia: negocio.distancia ?? null,
        };
      });

      res.status(200).json({
        exito: true,
        ...respuesta,
      });
    } catch (error) {
      console.error("Error en paginación:", error);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  negocioRegistro = async (req, res) => {
    try {
      const validacion = validador(req.body, esquemaPropietario);

      if (!validacion.exito) {
        return res.status(400).send({
          exito: false,
          mensaje: validacion.mensaje,
          errores: validacion.errores,
        });
      }

      const { price_id, correo, contrasena, telefono, usuario, recurrente } =
        validacion.datos;

      var tramitePendienteRef = null;

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

      const token_verificacion = crypto.randomBytes(32).toString("hex");

      tramitePendienteRef =
        await this.#modeloTramitesPendientes.crearTramitePendienteNegocios(
          price_id,
          correo,
          await bcrypt.hash(contrasena, hashSaltRounds),
          telefono,
          usuario,
          token_verificacion,
          false,
          servs.membresiaTipo(price_id)
        );

      const session = await this.#interaccionStripe.crearSession(
        price_id,
        { tramiteId: tramitePendienteRef.id, recurrente: recurrente ?? false },
        `${front_URL}/pago_exitoso?tramite_id=${tramitePendienteRef.id}`, // enfoque para "live"
        `${front_URL}/pago_erroneo`, // enfoque para "live"
        recurrente ?? false
      );

      const mailOptions = {
        from: smtp,
        to: correo,
        subject: "Confirma tu correo en Localy MX",
        html: this.#emails.verificacionEmail(usuario, session.url),
      };

      await transporter.sendMail(mailOptions);

      return res.status(202).json({
        exito: true,
        mensaje: "Usuario registrado. Se envió un correo de verificación.",
      });
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

    const validacion = validador(req.body, renovacion);

    if (!validacion.exito) return res.status(400).json(validacion);

    if (!negocio_id)
      return res.status(400).json({
        exito: false,
        error: "El ID del negocio es requerido en los parametros de la URL.",
      });

    var tramitePendienteRef = null;

    try {
      const negocioSnap = await this.#modeloNegocio.obtenerNegocio(negocio_id);

      if (!negocioSnap.exists)
        return res.status(404).json({
          exito: false,
          mensaje: "El negocio que se referencio no fue encontrado.",
        });

      const negocioDatos = negocioSnap.data();

      tramitePendienteRef =
        await this.#modeloTramitesPendientes.crearTramitePendiente_Renovacion(
          req.usuario.id,
          negocio_id,
          validacion.datos.price_id,
          servs.membresiaTipo(validacion.datos.price_id)
        );

      const session = await this.#interaccionStripe.crearSession(
        validacion.datos.price_id,
        {
          tramiteId: tramitePendienteRef.id,
          recurrente: validacion.datos.recurrente,
        },
        `${front_URL}/renovacion_exitosa?tramite_id=${tramitePendienteRef.id}`, // enfoque para "live"
        `${front_URL}/renovacion_erronea`, // enfoque para "live"
        validacion.datos.recurrente
      );

      return res.status(202).json({ exito: true, url: session.url });
    } catch (err) {
      if (tramitePendienteRef)
        this.#modeloTramitesPendientes.tramiteConcluido(tramitePendienteRef.id);
      console.error("Error al renovar la subscripcion:", err);
      res
        .status(500)
        .json({ exito: false, error: "Error al renovar la subscripcion" });
    }
  };

  subirMenuImagen = async (req, res) => {
    try {
      const { negocio_id } = req.params;

      const subirImagen = await this.#serviciosNegocios.subirImagenNegocio(
        req.file,
        negocio_id,
        req.usuario.id,
        "menu"
      );

      if (!subirImagen.exito) return res.status(500).json(subirImagen);

      await this.#modeloNegocio.subirMenu(
        negocio_id,
        subirImagen.url,
        subirImagen.ruta
      );

      return res.status(200).json({
        exito: true,
        mensaje: "La imagen fue subida correctamente al servidor.",
      });
    } catch (err) {
      console.error("Ocurrio un error al subir la imagen del menu:", err);
      res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor." });
    }
  };

  eliminarMenuImagen = async (req, res) => {
    try {
      const { negocio_id, menu_id } = req.params;

      if (!menu_id)
        return res.status(400).json({
          exito: false,
          mensaje:
            "Has olvidado añadir el id del menu en los parametros de la url.",
        });

      const negocioSnap = await this.#modeloNegocio.obtenerNegocio(negocio_id);
      const { menus } = negocioSnap.data();
      const objetivo = menus[menu_id];

      if (objetivo.ruta) await servs.borrarRuta(objetivo.ruta, false);

      await this.#modeloNegocio.eliminarMenu(negocio_id, menu_id);

      return res.status(200).json({
        exito: true,
        mensaje: "El menú fue borrado correctamente de la base de datos.",
      });
    } catch (err) {
      console.error("Ocurrio un error al eliminar la imagen del menu:", err);
      return res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor." });
    }
  };
}

export default Controlador_Negocio;
