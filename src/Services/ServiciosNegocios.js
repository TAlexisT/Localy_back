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
    usuario_locacion = null,
    cursor,
    direccion
  ) => {
    var consulta;
    var datos = [];

    if (!cursor) {
      // primera pagina
      var consultaAntes = await this.#modeloNegocio.tamanoConsultaOrdenada(
        tamano,
        true
      );
      consultaAntes = consultaAntes.where("randomKey", "<=", seed);

      var consultaDespues = await this.#modeloNegocio.tamanoConsultaOrdenada(
        tamano,
        false
      );
      consultaAntes = consultaAntes.where("randomKey", ">", seed);

      const [snapshotAntes, snapshotDespues] = await Promise.all([
        consultaAntes.get(),
        consultaDespues.get(),
      ]);

      // convina los valores aunque prioriza los valores mayores a "seed"
      snapshotAntes.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));
      snapshotDespues.forEach((doc) =>
        datos.push({ id: doc.id, ...doc.data() })
      );

      // Trim to page size
      datos = datos.slice(0, tamano);
    } else {
      if (direccion === "siguiente") {
        // siguiente pagina - Consigue los registros despues del cursor
        consulta = await this.#modeloNegocio.tamanoConsultaOrdenada(
          tamano,
          false
        );
        consulta = consulta.where("randomKey", ">", cursor);

        const snapshot = await consulta.get();
        snapshot.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

        // Si no tenemos suficientes resultados, envuelve al principio
        if (datos.length < tamano) {
          var consultaWrap = await this.#modeloNegocio.tamanoConsultaOrdenada(
            tamano - datos.length,
            false
          );
          consultaWrap = consultaWrap.where("randomKey", "<", seed);

          const snapshotWrap = await consultaWrap.get();
          snapshotWrap.forEach((doc) =>
            datos.push({ id: doc.id, ...doc.data() })
          );
        }
      } else if (direccion === "previo") {
        // pagina previa - Consigue los registros antes del cursor
        consulta = await this.#modeloNegocio.tamanoConsultaOrdenada(
          tamano,
          true
        );
        consulta = consulta.where("randomKey", "<", cursor);

        const snapshot = await consulta.get();
        snapshot.forEach((doc) => datos.push({ id: doc.id, ...doc.data() }));

        // Si no tenemos suficientes resultados, envuelve al final
        if (datos.length < tamano) {
          var consultaWrap = await this.#modeloNegocio.tamanoConsultaOrdenada(
            tamano - datos.length,
            true
          );

          consultaWrap = consultaWrap.where("randomKey", ">", seed);

          const snapshotWrap = await consultaWrap.get();
          // Revertir el orden para mantener la consistencia
          const wrapData = [];
          snapshotWrap.forEach((doc) =>
            wrapData.push({ id: doc.id, ...doc.data() })
          );
          datos = [...wrapData.reverse(), ...datos].slice(0, tamano);
        }
        datos.reverse();
      }
    }
    if (usuario_locacion)
      datos = this.#incluirDistancia(datos, usuario_locacion);
    return {
      datos,
      primerToken: datos[0].id,
      ultimoToken: datos[datos.length - 1].id,
    };
  };

  paginacionNegocios_filtros = async (
    filtros,
    usuario_locacion = null,
    tamano,
    cursor,
    direccion
  ) => {
    var query = await this.#modeloNegocio.consultaBase();
    query = query.where("activo", "==", true);

    // paginacion
    if (cursor) {
      const cursorDoc = await this.#modeloNegocio.obtenerNegocio(cursor);
      if (direccion == "siguiente") query = query.startAfter(cursorDoc);
      else if (direccion == "anterior") query = query.endBefore(cursorDoc);
    }

    // Aplicamos el largo de la consulta
    query = query.limit(tamano);

    // Ejecutamos la consulta
    var snapshot = await query.get();

    if (snapshot.empty)
      return { datos: [], primerToken: null, ultimoToken: null };

    var negocios = [];
    const primerToken = snapshot.docs[0].id;
    const ultimoToken = snapshot.docs[snapshot.docs.length - 1].id;

    snapshot.forEach((doc) => {
      const negocio = doc.data();
      negocio.negocio_id = doc.id;
      negocios.push(negocio);
    });

    // Aplicamos filtros que no puede aplicar firebase

    const busquedaGeneral = filtros.general;
    if (busquedaGeneral) {
      const searchTerm = busquedaGeneral.toLowerCase();
      negocios = negocios.filter(
        (negocio) =>
          negocio.nombre &&
          negocio.descripcion &&
          (negocio.nombre.toLowerCase().includes(searchTerm) ||
            negocio.descripcion.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrado de proximidad (requiere ubicación del usuario y datos comerciales)
    if (filtros.proximidad && usuario_locacion) {
      const negocioIds = [...new Set(negocios.map((p) => p.negocio_id))];

      if (negocioIds.length > 0) {
        const negociosSnapshot = await this.#modeloNegocio.obtenerLista(
          negocioIds
        );

        negocios = [];
        negociosSnapshot.forEach((doc) => {
          const negocio = doc.data();
          negocio.negocio_id = doc.id;
          negocios.push(negocio);
        });

        // Calcular distancia y añadir negocios
        negocios = this.#incluirDistancia(negocios, usuario_locacion);

        // Ordenar por distancia
        negocios.sort((a, b) => {
          const distA = a?.distancia ?? Infinity;
          const distB = b?.distancia ?? Infinity;

          return filtros.proximidad === "ASC" ? distA - distB : distB - distA;
        });
      }
    }
    if (!filtros.proximidad && usuario_locacion)
      negocios = this.#incluirDistancia(negocios, usuario_locacion);

    return { datos: negocios, primerToken, ultimoToken };
  };

  subirImagenNegocio = async (imagen, negocio_id, usuario_id) => {
    if (!imagen)
      return { exito: false, mensaje: "No se proporcionó ninguna imagen." };

    const nombreArchivo = `negocios/usuario_${usuario_id}/negocio_${negocio_id}/${Date.now()}_${
      imagen.originalname
    }`;

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
        console.log("Error al subir imagen:", err);
        reject({ exito: false, mensaje: "Error al subir la imagen." });
      });

      stream.on("finish", async () => {
        try {
          await archivo.makePublic();
          const urlPublica = `https://storage.googleapis.com/${bucket.name}/${nombreArchivo}`;
          resolve({ exito: true, url: urlPublica });
        } catch (err) {
          console.log("Error al hacer la imagen pública:", err);
          reject({ exito: false, mensaje: "Error al procesar la imagen." });
        }
      });

      stream.end(imagen.buffer);
    });
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

  #incluirDistancia = (negocios, usuario_locacion) => {
    // Calcular distancia y añadir negocios
    return negocios.map((negocio) => {
      if (negocio && negocio.ubicacion) {
        const distance = this.#distanciaAprox(
          usuario_locacion.latitude,
          usuario_locacion.longitude,
          negocio.ubicacion._latitude,
          negocio.ubicacion._longitude
        );
        negocio.distancia = distance;
      }
      return negocio;
    });
  };
}

module.exports = ServiciosNegocios;
