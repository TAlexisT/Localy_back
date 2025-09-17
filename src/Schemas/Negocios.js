const Joi = require("joi");

const esquemaNegocio = Joi.object({
  nombre: Joi.string().min(1).max(100).required(),

  descripcion: Joi.string().max(500).allow("", null),

  ubicacion: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),

  horario: Joi.object({
    Lunes: Joi.object({
      apertura: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),

      cierre: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),
    }).allow("", null),

    Martes: Joi.object({
      apertura: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),

      cierre: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),
    }).allow("", null),

    Miercoles: Joi.object({
      apertura: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),

      cierre: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),
    }).allow("", null),

    Jueves: Joi.object({
      apertura: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),

      cierre: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),
    }).allow("", null),

    Viernes: Joi.object({
      apertura: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),

      cierre: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),
    }).allow("", null),

    Sabado: Joi.object({
      apertura: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),

      cierre: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),
    }).allow("", null),

    Domingo: Joi.object({
      apertura: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),

      cierre: Joi.string()
        .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
        .allow("", null),
    }).allow("", null),
  }).required(),

  redes: Joi.object({
    WhatsApp: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .allow(null, ""),

    X: Joi.string().allow(null, ""),

    Facebook: Joi.string().uri().allow(null, ""),

    Instagram: Joi.string().uri().allow(null, ""),

    TikTok: Joi.string().uri().allow(null, ""),
  }).required(),
});

const esquemaPropietario = Joi.object({
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

  telefono: Joi.string().pattern(new RegExp("^[+]?[0-9]{8,15}$")).messages({
    "string.pattern.base":
      "Please provide a valid phone number with 8-15 digits",
  }),

  price_id: Joi.string()
    .pattern(/^price_[a-zA-Z0-9]{24}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Price ID must be a valid Stripe price ID format (price_ followed by 24 alphanumeric characters)",
      "any.required": "Price ID is required",
    }),
});

const paginacionParams = Joi.object({
  tamano: Joi.number().integer().min(1).max(50).default(20),
  direccion: Joi.string().valid("siguiente", "anterior").default("siguiente"),
  seed: Joi.number()
    .precision(8)
    .default(() => parseFloat(Math.random().toFixed(8))),
  cursor: Joi.number().precision(8).allow(null),
});

const paginacionFiltros = Joi.object({
  proximidad: Joi.string().valid("DESC", "ASC").allow("", null).messages({
    "string.valid": "Proximidad debe de ser igual a 'DESC' or 'ASC'",
  }),
  general: Joi.string().max(100).allow("", null).messages({
    "string.max": "El filtro general no debe exceder los 100 caracteres",
  }),
  usuario_locacion: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).allow(null),
});

module.exports = {
  esquemaNegocio,
  esquemaPropietario,
  paginacionParams,
  paginacionFiltros,
};
