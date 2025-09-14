const validador = (datos, schema) => {
  const { error, value } = schema.validate(datos, {
    abortEarly: false, // Recolecta todos los errores, no solo el primero
    allowUnknown: false, // Rechaza los campos desconocidos
    stripUnknown: true, // Remueve los campos desconocidos de los datos validados
  });

  // En caso de que exista algun error
  if (error) {
    const erroresFormato = error.details.map((detail) => ({
      campo: detail.path.join("."),
      mensaje: detail.message,
      tipo: detail.type,
    }));

    return {
      exito: false,
      errores: erroresFormato,
      mensaje: "La validacion fallo",
    };
  }

  // En caso de que no exista ningun error
  return {
    exito: true,
    datos: value,
    mensaje: "La validacion se concreto correctamente",
  };
};

module.exports = { validador };
