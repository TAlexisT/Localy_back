const Joi = require("joi");

const esquemaUsuario = Joi.object({
  usuario: Joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum": "Username must only contain alphanumeric characters",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
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
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 30 characters",
      "any.required": "Password is required",
    }),

  correo: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "org", "es"] },
    })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  tipo: Joi.string()
    .valid("admin", "usuario", "propietario")
    .default("usuario")
    .messages({
      "any.only": "User type must be one of: admin, usuario, propietario",
    }),

  telefono: Joi.string().pattern(new RegExp("^[+]?[0-9]{8,15}$")).messages({
    "string.pattern.base":
      "Please provide a valid phone number with 8-15 digits",
  }),
});

module.exports = {esquemaUsuario}