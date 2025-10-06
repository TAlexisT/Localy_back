require("dotenv").config();
const bcrypt = require("bcrypt");

const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Negocio = require("../db/Negocios");

const {
  esquemaUsuario,
  favoritoTipo,
  crearFavorito,
} = require("../Schemas/Usuarios");
const { validador } = require("../Validators/Validador");
const servs = require("../Services/ServiciosGenerales");

const { hashSaltRounds } = require("../../Configuraciones");

class Controlador_Usuario {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloNegocio;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloNegocio = new Modelo_Negocio();
  }

  registro = async (req, res) => {
    const validacion = validador(req.body, esquemaUsuario);

    if (!validacion.exito)
      return res.status(400).send({
        exito: validacion.exito,
        mensaje: validacion.mensaje,
        error: validacion.errores,
      });

    const { usuario, contrasena, correo } = validacion.datos;

    try {
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

      // Creacion de un nuevo usuario
      const refID = await this.#modeloUsuario.registrarUsuario(
        usuario,
        await bcrypt.hash(contrasena, hashSaltRounds),
        correo,
        "usuario"
      );

      if (!refID)
        return res.status(400).json({
          exito: false,
          mensaje: "El usuario no pudo ser añadido.",
        });

      const token = servs.jwt_accessToken({
        id: refID.id,
        usuario: usuario,
        correo: correo,
        tipo: "usuario",
        negocioId: null,
      });

      return res
        .cookie(
          "token_de_acceso",
          token,
          servs.cookieParser_AccessTokenConfigs()
        )
        .status(201)
        .json({
          exito: true,
          message: "Usuario registrado correctamente",
          datos: {
            id: refID.id,
            usuario: usuario,
            correo: correo,
            tipo: "usuario",
            negocioId: null,
          },
        });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res
        .status(500)
        .json({ exito: false, error: "Error interno al registrar usuario" });
    }
  };

  login = async (req, res) => {
    const acceso = req.cookies.token_de_acceso;

    if (acceso) {
      const extraccion = servs.jwt_dataExtraction(acceso);

      if (extraccion.exito) {
        const usuarioSnap = await this.#modeloUsuario.obtenerUsuario(
          extraccion.datos.id
        );
        const usuarioDatos = usuarioSnap.data();

        extraccion.datos["productos_favoritos"] =
          usuarioDatos.productos_favoritos || {};
        extraccion.datos["negocios_favoritos"] =
          usuarioDatos.negocios_favoritos || {};

        return res.status(200).json({ extraccion });
      } else {
        return res.status(400).json(extraccion);
      }
    }

    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: "Correo y contraseña requeridos" });
    }

    try {
      const info = await this.#modeloUsuario.usuario(correo);

      if (info == null) {
        return res
          .status(401)
          .json({ exito: false, error: "Credenciales inválidas" });
      }

      const esValido = await bcrypt.compare(
        contrasena,
        info.usuario.contrasena
      );

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
      } else info.negocioId = null;

      const datos = {
        id: info.usuarioId,
        usuario: info.usuario.usuario,
        correo: info.usuario.correo,
        tipo: info.usuario.tipo,
        negocioId: info.negocioId,
      };

      const token = servs.jwt_accessToken(datos);
      const atConfigs = servs.cookieParser_AccessTokenConfigs();

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

      const favoritosSnap = await this.#modeloUsuario.obtenerUsuario(
        usuario_id
      );

      if (!favoritosSnap.exists)
        return res.status(404).json({
          exito: false,
          mensaje: `El usuario con el id: ${usuario_id} no fue encontrado en la base de datos`,
        });

      const { negocios_favoritos, productos_favoritos } = favoritosSnap.data();

      return res.status(200).json({
        exito: true,
        datos: {
          negocios_favoritos: negocios_favoritos || [],
          productos_favoritos: productos_favoritos || [],
        },
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
        .status(403)
        .json({ exito: false, mensaje: "La sesion es invalida o no existe" });

    return res.status(200).json({ exito: true, datos: req.usuario });
  };

  autenticarNegocio = async (req, res) => {
    if (!req.usuario)
      return res
        .status(403)
        .json({ exito: false, mensaje: "La sesion es invalida o no existe" });

    return res.status(200).json({
      exito: true,
      mensaje: "El usuario y negocio estan autenticados.",
    });
  };
}

module.exports = Controlador_Usuario;
