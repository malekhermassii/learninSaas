const nodemailer = require("nodemailer");

// Configuration du transporteur SMTP avec Gmail
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "rihabchebil10@gmail.com", // Remplace par ton adresse e-mail
        pass: "pqhqukmjcpcpoues"

    }
});

// Vérifier la connexion SMTP
transporter.verify((error, success) => {
    if (error) {
        console.error("Erreur de configuration SMTP :", error);
    } else {
        console.log("SMTP prêt à envoyer des emails !");
    }
});

module.exports = transporter;
