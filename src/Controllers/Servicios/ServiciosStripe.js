const Modelo_Usuario = require("../../db/Usuarios");
const Modelo_Negocio = require("../../db/Negocios");
const Modelo_Tramites_Pendientes = require("../../db/Tramites_Pendientes");
const Interaccion_Stripe = require("../../ThirdParty/Stripe");

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

module.exports = ServiciosStripe;
