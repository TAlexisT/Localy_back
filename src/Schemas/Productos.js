const joi = require("joi");

const esquemaProductoUpload = joi.object({
  nombre: joi.string().min(1).max(100).required().messages({
    "string.min": "El nombre del producto debe tener al menos 1 caracter",
    "string.max": "El nombre del producto no pued exceder los 100 caracteres",
    "any.required": "El nombre del producto es requerido",
  }),
  precio: joi.number().min(0).required().messages({
    "number.base": "El precio de be ser un numero valido",
    "number.min": "El precio no puede ser negativo",
    "any.required": "El precio es requerido",
  }),
  categoria: joi.string().alphanum().min(1).max(50).required().messages({
    "string.min": "La categoria del producto debe tener al menos 1 caracter",
    "string.max": "La categoria del producto no pued esceder los 50 caracteres",
    "string.alphanum":
      "La categoria del producto solo puede contener letras y numeros",
    "any.required": "La categoria del producto es requerida",
  }),
  descripcion: joi.string().max(500).allow("", null).messages({
    "string.max":
      "La descripcion del producto no pued exceder los 500 caracteres",
  }),
  en_oferta: joi.boolean().default(false).messages({
    "boolean.base": `"en_oferta" must be true or false`,
    "any.required": `"en_oferta" is required`,
  }),
});

const paginacionParams = joi.object({
  tamano: joi.number().integer().min(1).max(50).default(20),
  direccion: joi.string().valid("siguiente", "anterior").default("siguiente"),
  seed: joi
    .number()
    .precision(8)
    .default(() => parseFloat(Math.random().toFixed(8))),
  cursor: joi.alternatives().try(joi.number(), joi.string()).allow(null),
});

const paginacionFiltros = joi.object({
  general: joi.string().max(100).allow("", null).messages({
    "string.max": "El filtro general no debe exceder los 100 caracteres",
  }),
  categoria: joi.string().alphanum().max(50).allow("", null).messages({
    "string.max": "La categoria del producto no pued esceder los 50 caracteres",
    "string.alphanum":
      "La categoria del producto solo puede contener letras y numeros",
  }),
  precio_orden: joi.string().valid("DESC", "ASC").allow("", null).messages({
    "string.base": "El valor del ordenamiento debe ser de tipo texto.",
    "anu.only": "El valor del ordenamiento debe ser 'ASC' o 'DESC'.",
  }),
  precio_rango: joi
    .string()
    .pattern(/^\d+(\.\d+)?-\d+(\.\d+)?$/)
    .allow("", null)
    .messages({
      "string.valid":
        "El rango de precio tiene que ser un string que contenga los limites: minNum - maxNum",
      "string.pattern.base":
        "El patron del string tiene que ser: <minNum - maxNum>",
    }),
});

module.exports = { esquemaProductoUpload, paginacionFiltros, paginacionParams };
