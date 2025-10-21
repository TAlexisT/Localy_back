const SubscripcionJobs = require("../jobs/GestionarSuscripcionJobs");

class Controlador_Admin {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #subscripcionJobs;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#subscripcionJobs = new SubscripcionJobs();
  }

  dispararSubscripcionJobs = async (req, res) => {
    try {
      await this.#subscripcionJobs.triggerManualRun();
      res.status(200).json({
        exito: true,
        mensaje: "Los jobs fueron manualmente ejecutados de forma correcta",
      });
    } catch (err) {
      console.error(
        "Ocurrio un error al ejecutar manualmente los jobs referentes a las subscripciones."
      );
      res
        .status(500)
        .json({ exito: false, mensaje: "Ocurrio un error en el servidor" });
    }
  };
}

module.exports = Controlador_Admin;
