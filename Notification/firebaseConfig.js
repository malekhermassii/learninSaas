// initialiser Firebase Admin SDK

const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk.json"); // Assurez-vous d'avoir téléchargé votre fichier de clé de service

// Initialisation de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
