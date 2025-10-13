const Modelo_Negocio = require("../db/Negocios");
const Modelo_Sugerencia = require("../db/Sugerencias");

const { subirSugerencia } = require("../Schemas/Sugerencias");
const { validador } = require("../Validators/Validador");

class Controlador_Sugerencia {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloNegocio;
  #modeloSugerencia;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloNegocio = new Modelo_Negocio();
    this.#modeloSugerencia = new Modelo_Sugerencia();
  }

  crearSugerencia = async (req, res) => {
    try {
      const validacion = validador(req.body, subirSugerencia);
      if (!validacion.exito) return res.status(400).json(validacion);

      const { titulo, descripcion } = validacion.datos;
      var negocio = await this.#modeloNegocio.obtenerNegocio(req.negocio_id);
      negocio = negocio.data();

      const nuevaSugerencia = await this.#modeloSugerencia.crearSugerencia(
        titulo,
        descripcion,
        req.negocio_id,
        negocio.nombre,
        req.usuario.correo,
        req.usuario.usuario
      );

      res.status(200).json({
        exito: true,
        mensaje: "La sugerencia fue creada correctamente",
      });
    } catch (err) {
      console.error("Un error ocurrio al subir una nueva sugerencia:", err);
      res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor" });
    }
  };

  borrarSugerencia = async (req, res) => {
    try {
      const { sugerencia_id } = req.params;
      if (!sugerencia_id)
        return res.status(400).json({
          exito: false,
          mensaje: "El id de la sugerencia no fue proporcionado",
        });

      await this.#modeloSugerencia.borrarSugerencia(sugerencia_id);

      return res.status(200).json({
        exito: true,
        mensaje: `La sugerencia con el id ${sugerencia_id} fue borrada correctamente`,
      });
    } catch (err) {
      console.error("Un error ocurrio al borrar una sugerencia:", err);
      res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor" });
    }
  };

  mostrarCadaSugerencia = async (req, res) => {
    try {
      const snapshot = await this.#modeloSugerencia.obtenerSugerencias(true);
      const sugerencias = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ exito: true, datos: sugerencias });
    } catch (err) {
      console.error("Ocurrió un error al mostrar cada sugerencia:", err);
      res.status(500).json({
        exito: false,
        mensaje: "Ocurrió un error en el servidor",
      });
    }
  };

  mostrarSugerenciasNegocio = async (req, res) => {
    try {
      const snapshot = await this.#modeloSugerencia.obtenerSugerencias(
        false,
        req.negocio_id
      );
      const sugerencias = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ exito: true, datos: sugerencias });
    } catch (err) {
      console.error(
        "Ocurrió un error al mostrar las sugerencias de negocio:",
        err
      );
      res.status(500).json({
        exito: false,
        mensaje: "Ocurrió un error en el servidor",
      });
    }
  };
}

module.exports = Controlador_Sugerencia;
