const Modelo_Usuario = require("../db/Usuarios");
const Modelo_Restaurante = require("../db/Restaurantes");

class Controlador_Restaurante {
  /**
   * Declaracion de variables secretas (privadas)
   */
  // #modeloUsuario;
  #modeloRestaurante;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    // this.#modeloUsuario = new Modelo_Usuario();
    this.#modeloRestaurante = new Modelo_Restaurante();
  }

  obtenerRestaurante = async (req, res) => {
    const { id } = req.params;

    if (!id)
      return req.status(400).json({
        error:
          "Es obligatorio añadir un id de restaurante en el cuerpo de la petición",
      });

    try {
      const doc = await this.#modeloRestaurante.obtenerRestaurante(id);

      if (!doc.exists) {
        return res.status(404).json({ error: "Restaurante no encontrado" });
      }

      res.status(200).json(doc.data());
    } catch (err) {
      console.error("Error al obtener restaurante:", err);
      res.status(500).json({ error: "Error del servidor" });
    }
  };

  actualizarPerfil = async (req, res) => {
    const restauranteId = req.params.id;
    const datos = req.body;

    // ¡¡¡ Necesitamos una validación de los datas para asegurarnos de ningun tipo de brecha de seguridad !!!!

    if (!restauranteId) {
      return res
        .status(400)
        .json({ error: "ID de restaurante no proporcionado." });
    }

    try {
      await this.#modeloRestaurante.actualizarRestaurante(restauranteId, datos);

      res.status(200).json({ message: "Perfil guardado correctamente" });
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      res.status(500).json({ error: "Error al guardar el perfil" });
    }
  };

  paginacionRestaurantes = async (req, res) => {
    const tamano = parseInt(req.query.pageSize) || 5;
    const empezarDespuesDe = req.query.startAfter || null;
    
    try {
      // Se fija el limite para la consulta, sin embargo la consulta todavia no se ha realizado
      let consulta = await this.#modeloRestaurante.tamanoConsulta(tamano);

      // En caso de que haya un cursor, se seleccionan solo los registros despues de él
      if (empezarDespuesDe) {
        const ultimoDoc = await this.#modeloRestaurante.obtenerRestaurante(
          empezarDespuesDe
        );
        // Inicia la consulta despues del cursor seleccionado
        if (ultimoDoc.exists) {
          consulta = consulta.startAfter(ultimoDoc);
        }
      }

      // final mente, se ejecuta la consulta 
      const preVista = await consulta.get();

      if (preVista.empty)
        return res.status(200).json({ datos: [], ultimoToken: null });

      const datos = [];
      preVista.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

      // Obtiene el ultimo elemento del arreglo para la siguiente paginación
      const ultimoElemento = preVista.docs[preVista.docs.length - 1];

      res.status(200).json({
        datos,
        ultimoToken: ultimoElemento.id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  };
}

module.exports = Controlador_Restaurante;
