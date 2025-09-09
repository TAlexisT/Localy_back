require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Restaurante = require("../db/Restaurantes");

const { esquemaUsuario } = require("../Schemas/Usuarios");
const validador = require("../Validators/Validador");
const servs = require("./Servicios");

const { hashSaltRounds } = require("../../Configuraciones");

class Controlador_Usuario {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloUsuario;
  #modeloRestaurante;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloRestaurante = new Modelo_Restaurante();
  }

  registro = async (req, res) => {
    const validacion = validador(req.body, esquemaUsuario);

    if (!validacion.exito)
      return res.status(400).send({
        exito: validacion.exito,
        mensaje: validacion.mensaje,
        error: validacion.errores,
      });

    const { usuario, contrasena, correo, telefono } = validacion.datos;

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
        "usuario",
        telefono
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
        restauranteId: null,
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
            restauranteId: null,
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
      return res.status(extraccion.exito ? 200 : 400).json(extraccion);
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
        const restSnap = await this.#modeloRestaurante.restauranteDeUsuario(
          info.usuarioId
        );

        info.restauranteId = !restSnap.empty ? restSnap.docs[0].id : null;
      } else info.restauranteId = null;

      const token = servs.jwt_accessToken({
        id: info.usuarioId,
        usuario: info.usuario.usuario,
        correo: info.usuario.correo,
        tipo: info.usuario.tipo,
        restauranteId: info.restauranteId,
      });

      const atConfigs = servs.cookieParser_AccessTokenConfigs();

      res
        .cookie("token_de_acceso", token, atConfigs)
        .status(202)
        .json({
          exito: true,
          datos: {
            id: info.usuarioId,
            usuario: info.usuario.usuario,
            correo: info.usuario.correo,
            tipo: info.usuario.tipo,
            restauranteId: info.restauranteId,
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
}

module.exports = Controlador_Usuario;
