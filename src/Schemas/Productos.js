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
});

module.exports = { esquemaProductoUpload };
