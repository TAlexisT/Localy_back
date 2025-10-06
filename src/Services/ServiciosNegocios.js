const Modelo_Negocio = require("../db/Negocios");

const { bucket } = require("../../Configuraciones");

class ServiciosNegocios {
  /**
   * Declaracion de variables secretas (privadas)
   */
  #modeloNegocio;

  /**
   * Se inicializan todas las instancias de clases subyacentes
   */
  constructor() {
    this.#modeloNegocio = new Modelo_Negocio();
  }

  paginacionNegocios_alazar = async (
    tamano,
    seed,
    general = null,
    usuario_locacion = null,
    distancia_orden = null,
    distancia_rango = null,
    cursor,
    direccion
  ) => {
    var consulta;
    var datos = [];
    var primerToken = null;
    var ultimoToken = null;

    if (typeof cursor !== "number") cursor = null;

    const avanza = direccion == "siguiente" || !cursor;

    // siguiente pagina - Consigue los registros despues del cursor
    consulta = await this.#modeloNegocio.tamanoConsultaOrdenada(tamano, avanza);

    consulta = this.#aplicarFiltrosDistanci(
      consulta,
      distancia_orden,
      usuario_locacion,
      distancia_rango
    );

    if (!cursor || (cursor < seed && avanza) || (cursor > seed && !avanza)) {
      consulta = consulta.where(
        "random_key",
        avanza ? "<" : ">",
        !cursor ? seed : cursor
      );

      const snapshot = await consulta.get();

      datos = this.#extraerDatos(snapshot);

      if (datos.length < tamano) {
        consulta = await this.#modeloNegocio.tamanoConsultaOrdenada(
          tamano - datos.length,
          avanza
        );

        consulta = consulta.where("random_key", avanza ? ">" : "<", seed);

        consulta = this.#aplicarFiltrosDistanci(
          consulta,
          distancia_orden,
          usuario_locacion,
          distancia_rango
        );

        const snapshotDespues = await consulta.get();

        datos = [...datos, ...this.#extraerDatos(snapshotDespues)];
      }
    } else {
      consulta = consulta
        .where("random_key", avanza ? "<" : ">", cursor)
        .where("random_key", avanza ? ">" : "<", seed);

      const snapshot = await consulta.get();
      datos = this.#extraerDatos(snapshot);
    }

    if (!avanza) datos.reverse();

    primerToken = datos.length ? datos[0].random_key : null;
    ultimoToken = datos.length ? datos[datos.length - 1].random_key : null;

    if (general) datos = this.#aplicarFiltrosGeneral(datos, general);

    if (usuario_locacion) {
      datos = this.#incluirDistancia(datos, usuario_locacion, distancia_orden);
    }

    return {
      datos,
      primerToken,
      ultimoToken,
    };
  };

  subirImagenNegocio = async (imagen, negocio_id, usuario_id, tipo) => {
    if (!imagen)
      return { exito: false, mensaje: "No se proporcionó ninguna imagen." };

    var nombreArchivo = "";
    const prefijo = `negocios/negocio_${negocio_id}`;
    const sufijo = `${Date.now()}_${imagen.originalname}`;

    switch (tipo) {
      case "logo":
        nombreArchivo = `${prefijo}/${sufijo}`;
        break;

      case "menu":
        nombreArchivo = `${prefijo}/menus/${sufijo}`;
        break;

      default:
        return {
          exito: false,
          mensaje:
            "No se especifico el tipo en los parametros del metodo (back-end).",
        };
    }

    const archivo = bucket.file(nombreArchivo);
    const stream = archivo.createWriteStream({
      metadata: {
        contentType: imagen.mimetype,
        metadata: { usuario_id, negocio_id },
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on("error", (err) => {
        console.error("Error al subir imagen:", err);
        reject({ exito: false, mensaje: "Error al subir la imagen." });
      });

      stream.on("finish", async () => {
        try {
          await archivo.makePublic();
          const urlPublica = `https://storage.googleapis.com/${bucket.name}/${nombreArchivo}`;
          resolve({ exito: true, url: urlPublica, ruta: nombreArchivo });
        } catch (err) {
          console.log("Error al hacer la imagen pública:", err);
          reject({ exito: false, mensaje: "Error al procesar la imagen." });
        }
      });

      stream.end(imagen.buffer);
    });
  };

  obtenerMultiplesNegocios = async (productosRefs = []) => {
    const productosSnap = await this.#modeloNegocio.obtenerLista(productosRefs);

    if (!productosSnap) return [];
    return this.#extraerDatos(productosSnap);
  };

  #cuadroDelimitador = (center, radiusKm) => {
    const earthRadius = 6371; // km
    const lat = center.latitude;
    const lng = center.longitude;

    // latitude: 1° ≈ 111 km
    const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);

    // longitude delta depends on latitude
    const lngDelta =
      ((radiusKm / earthRadius) * (180 / Math.PI)) /
      Math.cos((lat * Math.PI) / 180);

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta,
    };
  };

  #distanciaAprox = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la tierra en KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  };

  #incluirDistancia = (negocios, usuario_locacion, orden) => {
    // Calcular distancia y añadir negocios
    negocios = negocios.map((negocio) => {
      if (negocio && negocio.ubicacion) {
        const distance = this.#distanciaAprox(
          usuario_locacion.latitude,
          usuario_locacion.longitude,
          negocio.ubicacion.latitude,
          negocio.ubicacion.longitude
        );
        negocio.distancia = distance;
      }
      return negocio;
    });

    negocios.sort((a, b) =>
      orden == "DESC" ? b.distancia - a.distancia : a.distancia - b.distancia
    );

    return negocios;
  };

  #extraerDatos = (snapshot) => {
    const datos = [];
    snapshot.forEach((doc) => {
      const negocioDatos = doc.data();
      if (negocioDatos.nombre) {
        const {
          activo,
          actualizado,
          creado,
          pago_fecha,
          random_key,
          stripe,
          ...demasDatos
        } = doc.data();
        datos.push({ negocio_id: doc.id, ...demasDatos });
      }
    });

    return datos;
  };

  #aplicarFiltrosDistanci = (
    consulta,
    distancia_orden = null,
    usuario_locacion = null,
    distancia_rango = null
  ) => {
    if (usuario_locacion && distancia_orden && distancia_rango) {
      const delimitacion = this.#cuadroDelimitador(
        usuario_locacion,
        distancia_rango
      );

      return consulta
        .where("ubicacion.latitude", ">=", delimitacion.minLat)
        .where("ubicacion.latitude", "<=", delimitacion.maxLat)
        .where("ubicacion.longitude", ">=", delimitacion.minLng)
        .where("ubicacion.longitude", "<=", delimitacion.maxLng)
        .orderBy("ubicacion.latitude", distancia_orden.toLowerCase());
    }

    return consulta;
  };

  #aplicarFiltrosGeneral = (array, general) => {
    const searchTerm = general.toLowerCase();

    return array.filter((item) => {
      const nombre = item.nombre?.toLowerCase() || "";
      const descripcion = item.descripcion?.toLowerCase() || "";

      return nombre.includes(searchTerm) || descripcion.includes(searchTerm);
    });
  };
}

module.exports = ServiciosNegocios;
