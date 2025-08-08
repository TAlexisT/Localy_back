const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Restaurante = require("../db/Restaurantes");

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
    const { usuario, contrasena, correo, tipo } = req.body;

    if (!usuario || !contrasena || !correo || !tipo) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    try {
      if (await this.#modeloUsuario.correoExiste(correo)) {
        return res.status(400).json({ error: "El correo ya está registrado." });
      }

      if (await this.#modeloUsuario.nombreExiste(usuario)) {
        return res
          .status(400)
          .json({ error: "El nombre de usuario ya existe." });
      }

      // Creacion de un nuevo usuario
      const refID = await this.#modeloUsuario.registrarUsuario(
        usuario,
        contrasena,
        correo,
        tipo
      );

      res.status(201).json({
        message: "Usuario registrado correctamente",
        usuarioId: refID,
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      res.status(500).json({ error: "Error interno al registrar usuario" });
    }
  };

  login = async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: "Correo y contraseña requeridos" });
    }

    try {
      const info = await this.#modeloUsuario.usuario(correo, contrasena);

      if (info == null) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      if (info.usuario.tipo === "negocio") {
        const restSnap = await this.#modeloRestaurante.restauranteDeUsuario(
          info.usuarioId
        );

        info.restauranteId = !restSnap.empty ? restSnap.docs[0].id : null;
      } else info.restauranteId = null;

      res.status(202).json({
        id: info.usuarioId,
        usuario: info.usuario.usuario,
        correo: info.usuario.correo,
        tipo: info.usuario.tipo,
        restauranteId: info.restauranteId,
      });
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };
}

module.exports = Controlador_Usuario;
