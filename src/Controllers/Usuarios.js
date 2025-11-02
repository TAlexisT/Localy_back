import { hash, compare } from "bcrypt";
import { randomBytes } from "crypto";

import Modelo_Usuario from "../db/Usuarios.js";
import Modelo_Negocio from "../db/Negocios.js";
import Modelo_Tramites_Pendientes from "../db/Tramites_Pendientes.js";

import Emails_ThirdParty from "../ThirdParty/Emails.js";

import { smtp } from "../../Configuraciones.js";
import {
  esquemaUsuario,
  favoritoTipo,
  crearFavorito,
  validarUbicacion,
  peticionCambioContrasena,
  cambioContrasena,
} from "../Schemas/Usuarios.js";
import { validador } from "../Validators/Validador.js";
import ServiciosGenerales from "../Services/ServiciosGenerales.js";
import servicios_producto from "../Services/ServiciosProductos.js";
import servicios_negocio from "../Services/ServiciosNegocios.js";

import {
  hashSaltRounds,
  transporter,
  front_URL,
  back_URL,
} from "../../Configuraciones.js";

class Controlador_Usuario {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloNegocio;
  #emails;
  #modeloTramitesPendietes;
  #serviciosProducto;
  #serviciosNegocio;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloNegocio = new Modelo_Negocio();
    this.#emails = new Emails_ThirdParty();
    this.#modeloTramitesPendietes = new Modelo_Tramites_Pendientes();
    this.#serviciosNegocio = new servicios_negocio();
    this.#serviciosProducto = new servicios_producto();
  }

  registro = async (req, res) => {
    try {
      const validacion = validador(req.body, esquemaUsuario);

      if (!validacion.exito)
        return res.status(400).send({
          exito: validacion.exito,
          mensaje: validacion.mensaje,
          error: validacion.errores,
        });

      const { usuario, contrasena, correo } = validacion.datos;

      if (await this.#modeloUsuario.correoExiste(correo)) {
        return res
          .status(400)
          .json({ exito: false, error: "El correo ya está registrado." });
      }

      if (await this.#modeloUsuario.nombreExiste(usuario)) {
        return res
          .status(400)
          .json({ exito: false, error: "El nombre de usuario ya existe." });
      }

      const token_verificacion = randomBytes(32).toString("hex");

      const tramiteId =
        await this.#modeloTramitesPendietes.crearTramitePendienteUsuario(
          correo,
          await hash(contrasena, hashSaltRounds),
          usuario,
          token_verificacion
        );

      const mailOptions = {
        from: smtp,
        to: correo,
        subject: "Confirma tu correo en Localy MX",
        html: this.#emails.verificacionEmail(
          usuario,
          `${back_URL}/api/usuarios/verificar-email?tramite=${tramiteId.id}&token=${token_verificacion}`
        ),
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        exito: true,
        mensaje: "Usuario registrado. Se envió un correo de verificación.",
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res
        .status(500)
        .json({ exito: false, error: "Error interno al registrar usuario" });
    }
  };

  login = async (req, res) => {
    try {
      const acceso = req.cookies.token_de_acceso;

      if (acceso) {
        const extraccion = ServiciosGenerales.jwt_dataExtraction(acceso);

        if (extraccion.exito) {
          const usuarioSnap = await this.#modeloUsuario.obtenerUsuario(
            extraccion.datos.id
          );
          const usuarioDatos = usuarioSnap.data();

          extraccion.datos["productos_favoritos"] =
            usuarioDatos.productos_favoritos || [];
          extraccion.datos["negocios_favoritos"] =
            usuarioDatos.negocios_favoritos || [];

          return res.status(200).json({ extraccion });
        } else {
          return res.status(400).json(extraccion);
        }
      }

      const { correo, contrasena } = req.body;

      if (!correo || !contrasena) {
        return res
          .status(400)
          .json({ error: "Correo y contraseña requeridos" });
      }

      const info = await this.#modeloUsuario.usuario(correo);

      if (info == null) {
        return res
          .status(401)
          .json({ exito: false, error: "Credenciales inválidas" });
      }

      const esValido = await compare(contrasena, info.usuario.contrasena);

      if (!esValido)
        return res.status(401).json({
          exito: false,
          mensaje: "La contraseña no coincide con la del usuario",
        });

      if (info.usuario.tipo === "negocio") {
        const restSnap = await this.#modeloNegocio.negocioDeUsuario(
          info.usuarioId
        );

        info.negocioId = !restSnap.empty ? restSnap.docs[0].id : null;
        info.negocioActivo = !restSnap.empty
          ? restSnap.docs[0].data().activo
          : null;
      } else {
        info.negocioId = null;
        info.negocioActivo = null;
      }

      const datos = {
        id: info.usuarioId,
        usuario: info.usuario.usuario,
        correo: info.usuario.correo,
        tipo: info.usuario.tipo,
        negocioId: info.negocioId,
        negocioActivo: info.negocioActivo,
      };

      const token = ServiciosGenerales.jwt_accessToken(datos);
      const atConfigs = ServiciosGenerales.cookieParser_AccessTokenConfigs();

      res
        .cookie("token_de_acceso", token, atConfigs)
        .status(202)
        .json({
          exito: true,
          datos: {
            negocios_favoritos: info.usuario.negocios_favoritos || [],
            productos_favoritos: info.usuario.productos_favoritos || [],
            ...datos,
          },
        });
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  logout = async (req, res) => {
    res
      .clearCookie("token_de_acceso")
      .json({ exito: true, mensaje: "Sesión cerrada" });
  };

  borrarFavorito = async (req, res) => {
    try {
      const { favorito_id, tipo } = req.params;

      const validacion = validador({ tipo, favorito_id }, favoritoTipo);

      if (!validacion.exito) return res.status(400).json(validacion);

      await this.#modeloUsuario.borrarFavorito(
        req.usuario.id,
        favorito_id,
        tipo == "negocio" ? true : false
      );

      var usuario = await this.#modeloUsuario.obtenerUsuario(req.usuario.id);
      usuario = usuario.data();

      return res.status(200).json({
        exito: true,
        datos: {
          productos_favoritos: usuario.productos_favoritos || [],
          negocios_favoritos: usuario.negocios_favoritos || [],
        },
        mensaje:
          "El producto ya no forma parte de los productos favoritos del usuario.",
      });
    } catch (err) {
      console.error("Ocurrio un error al borrar un producto favorito:", err);
      res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor" });
    }
  };

  crearFavorito = async (req, res) => {
    try {
      const { usuario_id } = req.params;
      const { tipo, favorito_id } = req.body;

      const validacion = validador(
        { usuario_id, tipo, favorito_id },
        crearFavorito
      );

      if (!validacion.exito) return res.status(400).json(validacion);

      await this.#modeloUsuario.crearFavorito(
        usuario_id,
        favorito_id,
        tipo == "negocio"
      );

      var usuario = await this.#modeloUsuario.obtenerUsuario(usuario_id);
      usuario = usuario.data();

      return res.status(200).json({
        exito: true,
        datos: {
          productos_favoritos: usuario.productos_favoritos || [],
          negocios_favoritos: usuario.negocios_favoritos || [],
        },
        mensaje: `El ${tipo} favorito ha sido añadido`,
      });
    } catch (err) {
      console.error("Ocurrio un error al crear un favorito:", err);
      return res.status(500).json({
        exito: false,
        mensaje: "Ocurrio un error en el servidor",
      });
    }
  };

  mostrarFavoritos = async (req, res) => {
    try {
      const { usuario_id } = req.params;

      const validacion = validador(req.body, validarUbicacion);
      if (!validacion.exito) return res.status(400).json(validacion);

      const favoritosSnap = await this.#modeloUsuario.obtenerUsuario(
        usuario_id
      );
      if (!favoritosSnap.exists)
        return res.status(404).json({
          exito: false,
          mensaje: `El usuario con el id: ${usuario_id} no fue encontrado en la base de datos`,
        });

      const { negocios_favoritos, productos_favoritos } = favoritosSnap.data();
      var favoritos = {
        negocios_favoritos:
          await this.#serviciosNegocio.obtenerMultiplesNegocios(
            validacion.datos?.ubicacion || null,
            negocios_favoritos || []
          ),
        productos_favoritos:
          await this.#serviciosProducto.obtenerMultiplesProductos(
            productos_favoritos || []
          ),
      };

      return res.status(200).json({
        exito: true,
        datos: favoritos,
      });
    } catch (err) {
      console.error("Ocurrio un error al mostrar los objetos favoritos:", err);
      return res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor" });
    }
  };

  autenticarSecion = async (req, res) => {
    if (!req.usuario)
      return res
        .status(203)
        .json({ exito: false, mensaje: "La sesion es invalida o no existe" });

    return res.status(200).json({ exito: true, datos: req.usuario });
  };

  autenticarNegocio = async (req, res) => {
    if (!req.usuario)
      return res
        .status(203)
        .json({ exito: false, mensaje: "La sesion es invalida o no existe" });

    return res.status(200).json({
      exito: true,
      mensaje: "El usuario y negocio estan autenticados.",
    });
  };

  verificarEmail = async (req, res) => {
    try {
      const { tramite, token } = req.query;

      if (!tramite) {
        return res.status(400).send("Faltan parámetros de verificación");
      }

      var datos = await this.#modeloTramitesPendietes.obtenerTramitePendiente(
        tramite
      );

      if (!datos.exists)
        return res.status(404).json({
          exito: false,
          mensaje: "El trámite ya fue utilizado o no existe.",
        });

      const { correo, contrasena, usuario, tipo, token_verificacion } =
        datos.data();

      if (token !== token_verificacion)
        return res
          .status(401)
          .json({ extio: false, mensaje: "Los tokens no coinciden" });

      const ref = await this.#modeloUsuario.registrarUsuario(
        usuario,
        contrasena,
        correo,
        tipo
      );

      await this.#modeloTramitesPendietes.tramiteConcluido(datos.id);

      const info = await this.#modeloUsuario.usuario(correo);

      if (info.usuario.tipo === "negocio") {
        const restSnap = await this.#modeloNegocio.negocioDeUsuario(
          info.usuarioId
        );

        info.negocioId = !restSnap.empty ? restSnap.docs[0].id : null;
        info.negocioActivo = !restSnap.empty
          ? restSnap.docs[0].data().activo
          : null;
      } else {
        info.negocioId = null;
        info.negocioActivo = null;
      }

      const JWToken = ServiciosGenerales.jwt_accessToken({
        id: ref.id,
        usuario: usuario,
        correo: correo,
        tipo: info.usuario.tipo,
        negocioId: info.negocioId,
        negocioActivo: info.negocioActivo,
      });
      const atConfigs = ServiciosGenerales.cookieParser_AccessTokenConfigs();

      return res
        .cookie("token_de_acceso", JWToken, atConfigs)
        .redirect(`${front_URL}/`);
    } catch (error) {
      console.error("Error verificando correo:", error);
      return res.status(500).send("Error al verificar el correo.");
    }
  };

  peticionCambiarContrasena = async (req, res) => {
    try {
      const validacion = validador(req.body, peticionCambioContrasena);

      if (!validacion.exito) return res.status(400).json(validacion);

      const { correo } = validacion.datos;

      var usuario = await this.#modeloUsuario.usuario(correo);
      if (usuario == null)
        return res.status(404).json({
          exito: false,
          mensaje:
            "El usuario con el correo proporcionado no existe en la base de datos.",
        });

      const token_verificacion = randomBytes(32).toString("hex");

      const tramiteId =
        await this.#modeloTramitesPendietes.crearTramitePendienteContrasena(
          usuario.usuarioId,
          correo,
          token_verificacion
        );

      const mailOptions = {
        from: smtp,
        to: correo,
        subject: "Confirma el cambio de contraseña",
        html: this.#emails.verificacionCambioContrasena(
          usuario.usuario.usuario,
          `${front_URL}/cambiar_contrasena?tramite=${tramiteId.id}&token=${token_verificacion}`
        ),
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        exito: true,
        mensaje:
          "Se envió un correo de confirmación a tu dirección de correo electrónico.",
      });
    } catch (err) {
      console.error(
        "Ocurrio un error al hacer peticion de cambio de contraseña:",
        err
      );
      return res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor." });
    }
  };

  cambiarContrasena = async (req, res) => {
    try {
      const { tramite, token } = req.query;
      if (!tramite) {
        return res.status(400).send("Faltan parámetros de verificación");
      }

      const validacion = validador(req.body, cambioContrasena);
      if (!validacion.exito) return res.status(400).json(validacion);

      var datos = await this.#modeloTramitesPendietes.obtenerTramitePendiente(
        tramite
      );
      if (!datos.exists)
        return res.status(404).json({
          exito: false,
          mensaje: "El trámite ya fue utilizado o no existe.",
        });

      const { token_verificacion, usuario_id } = datos.data();

      if (token !== token_verificacion)
        return res
          .status(401)
          .json({ extio: false, mensaje: "Los tokens no coinciden" });

      await this.#modeloTramitesPendietes.tramiteConcluido(tramite);

      await this.#modeloUsuario.patchUsuario(usuario_id, {
        contrasena: await hash(validacion.datos.contrasena, hashSaltRounds),
      });

      res.status(200).json({
        exito: true,
        mensaje: "La contraseña fué actualizada correctamente.",
      });
    } catch (err) {
      console.error("Ocurrio un error al cambiar la contraseña:", err);
      return res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor" });
    }
  };
}

export default Controlador_Usuario;
