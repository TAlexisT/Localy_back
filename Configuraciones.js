require("dotenv").config();

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

const front_URL =
  process.env.CURRENT_ENV === "produccion"
    ? process.env.FRONTEND_URL_P
    : process.env.CURRENT_ENV === "test"
    ? process.env.FRONTEND_URL_T
    : process.env.FRONTEND_URL_D;

const corsConfigs = {
  origin: front_URL,
  credentials: true,
};

module.exports = {
  admin,
  db,
  bucket,
  stripe,
  hashSaltRounds,
  jwtSecreta,
  corsConfigs,
  front_URL,
};
