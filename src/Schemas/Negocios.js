const joi = require("joi");
const { borrarArchivo } = require("../Services/ServiciosGenerales");

const esquemaNegocio = joi.object({
  nombre: joi.string().min(1).max(100).required(),

  descripcion: joi.string().max(500).allow("", null),

  ubicacion: joi
    .object({
      latitude: joi.number().min(-90).max(90).required(),
      longitude: joi.number().min(-180).max(180).required(),
    })
    .required(),

  horario: joi
    .object({
      Lunes: joi
        .object({
          apertura: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),

          cierre: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),
        })
        .allow("", null),

      Martes: joi
        .object({
          apertura: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),

          cierre: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),
        })
        .allow("", null),

      Miercoles: joi
        .object({
          apertura: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),

          cierre: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),
        })
        .allow("", null),

      Jueves: joi
        .object({
          apertura: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),

          cierre: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),
        })
        .allow("", null),

      Viernes: joi
        .object({
          apertura: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),

          cierre: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),
        })
        .allow("", null),

      Sabado: joi
        .object({
          apertura: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),

          cierre: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),
        })
        .allow("", null),

      Domingo: joi
        .object({
          apertura: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),

          cierre: joi
            .string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .allow("", null),
        })
        .allow("", null),
    })
    .required(),

  redes: joi
    .object({
      WhatsApp: joi
        .string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .allow(null, ""),

      X: joi.string().allow(null, ""),

      Facebook: joi.string().uri().allow(null, ""),

      Instagram: joi.string().uri().allow(null, ""),

      TikTok: joi.string().uri().allow(null, ""),
    })
    .required(),

  borrar_logo: joi.boolean().truthy("true").falsy("false").required().messages({
    "any.required": "El campo 'borrar_logo' es obligatorio.",
    "boolean.base": "El campo 'borrar_logo' debe ser verdadero o falso.",
  }),
});

const esquemaPropietario = joi.object({
  usuario: joi.string().alphanum().min(3).max(30).required().messages({
    "string.alphanum": "Username must only contain alphanumeric characters",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
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
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 30 characters",
      "any.required": "Password is required",
    }),

  correo: joi
    .string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "org", "es"] },
    })
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  telefono: joi.string().pattern(new RegExp("^[+]?[0-9]{8,15}$")).messages({
    "string.pattern.base":
      "Please provide a valid phone number with 8-15 digits",
  }),

  price_id: joi
    .string()
    .pattern(/^price_[a-zA-Z0-9]{24}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Price ID must be a valid Stripe price ID format (price_ followed by 24 alphanumeric characters)",
      "any.required": "Price ID is required",
    }),

  recurrente: joi.boolean(),
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
  usuario_locacion: joi
    .object({
      latitude: joi.number().min(-90).max(90).required(),
      longitude: joi.number().min(-180).max(180).required(),
    })
    .allow(null),
  distancia_orden: joi
    .string()
    .valid("DESC", "ASC")
    .default("ASC")
    .allow(null, "")
    .messages({
      "string.base": "El valor de distancia debe ser un texto.",
      "any.only": "El valor de distancia solo puede ser 'ASC' o 'DESC'.",
    }),
  distancia_rango: joi.number().min(1).max(25).default(1).allow(null).messages({
    "number.base": "La distancia debe ser un número.",
    "number.min": "La distancia mínima permitida es de 1 km.",
    "number.max": "La distancia máxima permitida es de 25 km.",
    "any.required": "Debes especificar una distancia.",
  }),
});

module.exports = {
  esquemaNegocio,
  esquemaPropietario,
  paginacionParams,
  paginacionFiltros,
};
