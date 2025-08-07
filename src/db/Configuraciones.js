require("dotenv").config();

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON)
  ),
});

const db = admin.firestore();

module.exports = { admin, db };
