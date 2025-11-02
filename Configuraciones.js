import dotenv from "dotenv";
import nodemailer from "nodemailer";
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
const stripe = stripeModule.default(process.env.TEST_SECRET_KEY);
const webhook = process.env.TEST_WH_SECRET;

const hashSaltRounds = entorno === "produccion" ? 15 : 3;

const jwtSecreta =
  entorno === "produccion"
    ? process.env.JWT_SECRET_KEY_P
    : entorno === "test"
    ? process.env.JWT_SECRET_KEY_T
    : process.env.JWT_SECRET_KEY_D;

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
};

const smtp = process.env.SMTP_USUARIO || process.env.SMTP_ORIGEN;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USUARIO,
    pass: process.env.SMTP_CONTRASENA,
  },
});

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
  transporter,
  pricesIdAmbulante,
  pricesIdRestaurante,
  webhook,
  smtp,
  entorno,
};
