const joi = require("joi");

const esquemaUsuario = joi.object({
  usuario: joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum":
      "El nombre de usuario debe contener solo caracteres alfanuméricos",
    "string.min": "El nombre de usuario debe contener como mínimo 3 caracteres",
    "string.max": "El nombre de usuario no debe exceder los 30 caracteres",
    "any.required": "El nombre de usuario es requerido",
  }),

  contrasena: joi
    .string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
      )
    )
    .min(8)
    .max(30)
    .required()
    .messages({
      "string.pattern.base":
        "La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial",
      "string.min": "La contraseña debe tener al menos 8 caracteres.",
      "string.max": "La contraseña no puede exceder los 30 caracteres",
      "any.required": "Se requiere contraseña",
    }),

  correo: joi
    .string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "org", "es"] },
    })
    .required()
    .messages({
      "string.email":
        "Por favor, proporcione una dirección de correo electrónico válida.",
      "any.required": "Se requiere correo electrónico",
    }),
});

const favoritoTipo = joi.object({
  tipo: joi.string().valid("negocio", "producto").required().messages({
    "any.required": "El campo 'tipo' es obligatorio.",
    "string.base": "El campo 'tipo' debe ser un texto.",
    "any.only": "El campo 'tipo' solo puede ser 'negocio' o 'producto'.",
  }),
  favorito_llave: joi.string().required().messages({
    "any.required": "El campo 'favorito_llave' es obligatorio.",
    "string.base": "El campo 'favorito_llave' debe ser un texto.",
  }),
});

const crearFavorito = joi.object({
  tipo: joi.string().valid("negocio", "producto").required().messages({
    "any.required": "El campo 'tipo' es obligatorio.",
    "string.base": "El campo 'tipo' debe ser un texto.",
    "any.only": "El campo 'tipo' solo puede ser 'negocio' o 'producto'.",
  }),

  usuario_id: joi
    .string()
    .pattern(/^[A-Za-z0-9]{20,}$/)
    .required()
    .messages({
      "any.required": "El campo 'usuario_id' es obligatorio.",
      "string.base": "El campo 'usuario_id' debe ser un texto.",
      "string.pattern.base":
        "El campo 'usuario_id' no tiene un formato válido.",
    }),

  favorito_id: joi
    .string()
    .pattern(/^[A-Za-z0-9]{20,}$/)
    .required()
    .messages({
      "any.required": "El campo 'favorito_id' es obligatorio.",
      "string.base": "El campo 'favorito_id' debe ser un texto.",
      "string.pattern.base":
        "El campo 'usuario_id' no tiene un formato válido.",
    }),
});

module.exports = { esquemaUsuario, favoritoTipo, crearFavorito };
