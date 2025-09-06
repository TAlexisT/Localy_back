require("dotenv").config();

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON)
  ),
});

const db = admin.firestore();

const stripe = require("stripe")(process.env.TEST_SECRET_KEY);

const hashSaltRounds = process.env.CURRENT_ENV === "produccion" ? 15 : 3;

const corsConfigs = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};

module.exports = { admin, db, stripe, hashSaltRounds, corsConfigs };
