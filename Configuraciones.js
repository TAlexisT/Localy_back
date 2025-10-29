require("dotenv").config();

const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON)
  ),
  storageBucket: process.env.FB_BUCKET_URL,
});

const bucket = admin.storage().bucket();

const db = admin.firestore();

const stripe = require("stripe")(process.env.TEST_SECRET_KEY);

const hashSaltRounds = process.env.CURRENT_ENV === "produccion" ? 15 : 3;

const jwtSecreta =
  process.env.CURRENT_ENV === "produccion"
    ? process.env.JWT_SECRET_KEY_P
    : process.env.CURRENT_ENV === "test"
    ? process.env.JWT_SECRET_KEY_T
    : process.env.JWT_SECRET_KEY_D;

var front_URL =
  process.env.CURRENT_ENV === "produccion"
    ? JSON.parse(process.env.FRONTEND_URL_P)
    : process.env.CURRENT_ENV === "test"
    ? JSON.parse(process.env.FRONTEND_URL_T)
    : JSON.parse(process.env.FRONTEND_URL_D);

var back_URL =
  process.env.CURRENT_ENV === "produccion"
    ? JSON.parse(process.env.BACKEND_URL_P)
    : process.env.CURRENT_ENV === "test"
    ? JSON.parse(process.env.BACKEND_URL_T)
    : JSON.parse(process.env.BACKEND_URL_D);

const corsConfigs = {
  origin: front_URL,
  credentials: true,
};

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

module.exports = {
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
};
