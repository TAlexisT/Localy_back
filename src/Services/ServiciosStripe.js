import Modelo_Usuario from "../db/Usuarios";
import Modelo_Negocio from "../db/Negocios";
import Modelo_Tramites_Pendientes from "../db/Tramites_Pendientes";
import Interaccion_Stripe from "../ThirdParty/Stripe";

class ServiciosStripe {
  /**
   * Declaracion de variables secretas (privadas)
   */
  static #modeloUsuario = new Modelo_Usuario();
  static #modeloNegocio = new Modelo_Negocio();
  static #modeloTramitesPendientes = new Modelo_Tramites_Pendientes();
  static #interaccionStripe = new Interaccion_Stripe();


  static async;
}

export default ServiciosStripe;
