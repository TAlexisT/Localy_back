const Modelo_Tramites_Pendientes = require("../db/Tramites_Pendientes");
const Modelo_Negocios = require("../db/Negocios");

const servs = require("../Services/ServiciosGenerales");

class Controlador_Tramites_Pendientes {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloTramitesPendientes;
  #modeloNegocios;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
    this.#modeloNegocios = new Modelo_Negocios();
  }

  obtenerTramite = async (req, res) => {
    const { id } = req.params;

    try {
      const tramiteRegistro =
        await this.#modeloTramitesPendientes.obtenerTramitePendiente(id);

      if (!tramiteRegistro.exists)
        res.status(404).json({
          exito: false,
          mensaje: `El registro especificado con el id: ${id} no fue encontrado dentro de la base de datos.`,
          datos: null,
        });

      const datosTramite = tramiteRegistro.data();

      const usuarioSnap = await this.#modeloNegocios.obtenerPropietario(
        datosTramite.negocio_id
      );

      const datos = {
        id: datosTramite.usuario_id,
        usuario: usuarioSnap.usuario,
        tipo: usuarioSnap.tipo,
        correo: usuarioSnap.correo,
        negocioId: datosTramite.negocio_id,
      };

      const token = servs.jwt_accessToken(datos);
      const atConfigs = servs.cookieParser_AccessTokenConfigs();

      await this.#modeloTramitesPendientes.tramiteConcluido(id);

      res.cookie("token_de_acceso", token, atConfigs).status(200).json({
        exito: true,
        mensaje: "Datos obtenidos correctamente.",
        datos: datos,
      });
    } catch (err) {
      console.log("Error en el servidor", err);
      return res.status(500).json({
        exito: false,
        mensaje: `Existió un error dentro del servidor`,
        datos: null,
      });
    }
  };
}

module.exports = Controlador_Tramites_Pendientes;
