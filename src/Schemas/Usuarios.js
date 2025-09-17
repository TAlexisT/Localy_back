const Joi = require("joi");

const esquemaUsuario = Joi.object({
  usuario: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum": "El nombre de usuario debe contener solo caracteres alfanuméricos",
    "string.min": "El nombre de usuario debe contener como mínimo 3 caracteres",
    "string.max": "El nombre de usuario no debe exceder los 30 caracteres",
    "any.required": "El nombre de usuario es requerido",
  }),

  contrasena: Joi.string()
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

  correo: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "org", "es"] },
    })
    .required()
    .messages({
      "string.email": "Por favor, proporcione una dirección de correo electrónico válida.",
      "any.required": "Se requiere correo electrónico",
    }),
});

module.exports = {esquemaUsuario}