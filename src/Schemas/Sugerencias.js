const joi = require("joi");

const subirSugerencia = joi.object({
  titulo: joi.string().min(1).max(100).required().messages({
    "string.min": "Debes de incluir el titulo de la sugerencia",
    "string.max": "El titulo no puede exceder los 100 caracteres",
    "any.required": "El titulo es requerido",
  }),
  descripcion: joi.string().max(5000).required().messages({
    "string.max": "La descripcion no puede exceder los 1000 caracteres",
    "any.required": "La descripcion es requerida",
  }),
  // importancia: joi.number().integer().min(1).max(5).required().messages({
  //   "number.base": "El valor de importancia debe ser un número.",
  //   "number.integer": "La importancia debe ser un número entero.",
  //   "number.min": "La importancia mínima permitida es 1.",
  //   "number.max": "La importancia máxima permitida es 5.",
  //   "any.required": "El campo 'importancia' es obligatorio.",
  // }),
});

module.exports = { subirSugerencia };
