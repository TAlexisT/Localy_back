import dotenv from "dotenv";
import { Resend } from "resend";
import admin from "firebase-admin";

dotenv.config();

const entorno = process.env.CURRENT_ENV;

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON)
  ),
  storageBucket: process.env.FB_BUCKET_URL,
});

const bucket = admin.storage().bucket();

const db = admin.firestore();

const stripeModule = await import("stripe");
const stripe = stripeModule.default(
  entorno === "produccion"
    ? process.env.SECRET_KEY
    : process.env.TEST_SECRET_KEY
);
const webhook =
  entorno === "produccion" ? process.env.WH_SECRET : process.env.TEST_WH_SECRET;

const hashSaltRounds = entorno === "produccion" ? 15 : 3;

const jwtSecreta =
  entorno === "produccion"
    ? process.env.JWT_SECRET_KEY_P
    : entorno === "test"
    ? process.env.JWT_SECRET_KEY_T
    : process.env.JWT_SECRET_KEY_D;

const cookieParser_AccessTokenConfigs = {
  httpOnly: true, // Accesible solo en el servidor
  secure: entorno === "produccion", // Se activará dependiendo de la variable de entorno "entorno"
  sameSite: entorno === "produccion" ? "none" : "lax", // Restringe la cookie solo a nuestro dominio
  maxAge: 1000 * 60 * 60, // Al generarse, solo tiene una validez en un lapso de una hora
  path: "/", // Nos aseguramos de que el alcance sea global
};

var front_URL =
  entorno === "produccion"
    ? JSON.parse(process.env.FRONTEND_URL_P)
    : entorno === "test"
    ? JSON.parse(process.env.FRONTEND_URL_T)
    : JSON.parse(process.env.FRONTEND_URL_D);

var back_URL =
  entorno === "produccion"
    ? JSON.parse(process.env.BACKEND_URL_P)
    : entorno === "test"
    ? JSON.parse(process.env.BACKEND_URL_T)
    : JSON.parse(process.env.BACKEND_URL_D);

const corsConfigs = {
  origin: front_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Cookie",
    "Set-Cookie",
  ],
  exposedHeaders: ["Set-Cookie"], // Important for cross-domain
};

const origin = process.env.CORREO_USUARIO || process.env.CORREO_ORIGEN;

const resend = new Resend(process.env.RESEND_KEY);

const host = entorno === "produccion" ? process.env.HOST_P : process.env.HOST_T;
const port =
  entorno === "produccion"
    ? process.env.PORT
      ? process.env.PORT
      : process.env.PORT_P
    : process.env.PORT_T;

const pricesIdAmbulante = JSON.parse(process.env.STRIPE_AMBULATNE_PRICES);
const pricesIdRestaurante = JSON.parse(process.env.STRIPE_RESTAURANTE_PRICES);

front_URL = front_URL[0];
back_URL = back_URL[0];

export {
  admin,
  db,
  bucket,
  stripe,
  hashSaltRounds,
  jwtSecreta,
  corsConfigs,
  front_URL,
  back_URL,
  pricesIdAmbulante,
  pricesIdRestaurante,
  webhook,
  origin,
  resend,
  entorno,
  host,
  port,
  cookieParser_AccessTokenConfigs,
};
