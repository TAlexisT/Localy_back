import Modelo_Tramites_Pendientes from "../db/Tramites_Pendientes.js";
import Modelo_Usuarios from "../db/Usuarios.js";
import ServiciosGenerales from "../Services/ServiciosGenerales.js";
import { cookieParser_AccessTokenConfigs } from "../../Configuraciones.js"

class Controlador_Tramites_Pendientes {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloTramitesPendientes;
  #modeloUsuario;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
    this.#modeloUsuario = new Modelo_Usuarios();
  }

  obtenerTramite = async (req, res) => {
    try {
      const { id } = req.params;
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      var tramiteReconocido = false;
      var concurrencia = 4;
      var tramiteRegistro;
      var datosTramite;

      while (concurrencia > 0) {
        tramiteRegistro =
          await this.#modeloTramitesPendientes.obtenerTramitePendiente(id);

        datosTramite = tramiteRegistro.data();

        if (datosTramite.usuario_id) {
          tramiteReconocido = true;
          break;
        }

        await sleep(1000);
        concurrencia--;
      }

      if (!tramiteRegistro.exists || !tramiteReconocido)
        res.status(404).json({
          exito: false,
          mensaje: `El registro especificado con el id: ${id} no fue encontrado dentro de la base de datos o no ha sido procesado aun.`,
          datos: null,
        });

      const usuarioSnap = await this.#modeloUsuario.obtenerUsuario(
        datosTramite.usuario_id,
      );

      const datosUsuario = usuarioSnap.data();

      const datos = {
        id: datosTramite.usuario_id,
        usuario: datosUsuario.usuario,
        tipo: datosUsuario.tipo,
        correo: datosUsuario.correo,
        negocioId: datosTramite.negocio_id,
        negocioActivo: true,
      };

      const token = ServiciosGenerales.jwt_accessToken(datos);
      const atConfigs = cookieParser_AccessTokenConfigs;

      res.cookie("token_de_acceso", token, atConfigs).status(200).json({
        exito: true,
        mensaje: "Datos obtenidos correctamente.",
        datos: datos,
      });
    } catch (err) {
      console.error("Error en el servidor", err);
      return res.status(500).json({
        exito: false,
        mensaje: `Existió un error dentro del servidor`,
        datos: null,
      });
    }
  };
}

export default Controlador_Tramites_Pendientes;
