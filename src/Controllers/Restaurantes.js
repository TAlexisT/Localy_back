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
    const cursorId = req.query.cursor || null;
    const direccion = req.query.direction || "siguiente";

    try {
      let consulta = await this.#modeloRestaurante.tamanoConsultaOrdenada(
        tamano,
        "desc"
      );
      const paginas =
        Math.ceil(
        (await this.#modeloRestaurante.totalDeRestaurantes()) / tamano
      );

      if (cursorId) {
        const cursorDoc = await this.#modeloRestaurante.obtenerRestaurante(
          cursorId
        );
        if (cursorDoc.exists) {
          if (direccion === "siguiente") {
            consulta = consulta.startAfter(cursorDoc);
          } else if (direccion === "previo") {
            // Para navegación hacia atrás, necesitamos invertir el orden temporalmente
            consulta = consulta.endBefore(cursorDoc);
          }
        }
      }

      const preVista = await consulta.get();
      if (preVista.empty) {
        return res.status(200).json({
          datos: [],
          primerToken: null,
          ultimoToken: null,
          paginas,
          paginaActual: 0,
          existeProx: false,
          existeAnt: false,
        });
      }

      let datos = [];
      preVista.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

      const primerToken = preVista.docs[0].id;
      const ultimoToken = preVista.docs[preVista.docs.length - 1].id;

      let paginaActual = 0;
      if (cursorId) {
        const index =
          (await this.#modeloRestaurante.posicionActual(primerToken, "desc")) +
          1;

        paginaActual = Math.ceil(index / tamano);
      } else paginaActual = 1;

      res.status(200).json({
        datos,
        primerToken,
        ultimoToken,
        paginas,
        paginaActual,
        existeProx: paginaActual < paginas,
        existeAnt: paginaActual > 1,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  };
}

module.exports = Controlador_Restaurante;
