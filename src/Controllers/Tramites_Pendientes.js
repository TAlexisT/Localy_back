const Modelo_Tramites_Pendientes = require("../db/Tramites_Pendientes");

class Controlador_Tramites_Pendientes {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloTramitesPendientes;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
  }

  obtenerTramited = async (req, res) => {
    const { id } = req.params;

    try {
      const tramiteRegistro =
        await this.#modeloTramitesPendientes.obtenerTramitePendiente(id);

      return tramiteRegistro.exists
        ? res.status(200).json({
            exito: true,
            mensaje: "Datos obtenidos correctamente.",
            datos: {
              ...tramiteRegistro.data(),
            },
          })
        : res.status(404).json({
            exito: false,
            mensaje: `El registro especificado con el id: ${id} no fue encontrado dentro de la base de datos.`,
            datos: null,
          });
    } catch (err) {
      return res.status(500).json({
        exito: false,
        mensaje: `Existió un error dentro del servidor: ${err.message}`,
        datos: null,
      });
    }
  };
}

module.exports = Controlador_Tramites_Pendientes;
