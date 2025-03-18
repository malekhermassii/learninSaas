
require("dotenv").config();
const express = require("express"); //gérer les requêtes HTTP
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const uploads = require("./uploads");
const { sendPushNotification } = require("./Notification/NotificationService");

//socket.io
const http = require("http"); //créer un serveur HTTP sur lequel Socket.IO va fonctionner.
const socketIo = require("socket.io"); //Gérer la communication en temps réel
const server = http.createServer(app); // Créer un serveur HTTP
const io = socketIo(server);
// Attacher Socket.IO au serveur
const bodyParser = require("body-parser");
const port = 3000;
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
// Middleware général (NE PAS inclure express.json ici)
app.use(express.urlencoded({ extended: true }));

// Middleware pour Stripe Webhooks (doit être AVANT `express.json()`)
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  session({
    // Secret used to sign session IDs (either from environment variable or fallback value)
    secret: process.env.SESSION_SECRET,
    // Prevents the session from being saved back to the session store if nothing has changed
    resave: false,
    // Prevents saving a session that has not been modified
    saveUninitialized: false,
    cookie: {
      // Ensures the cookie is only sent over HTTPS in production
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // Sets the session cookie's expiration time to 1 day
    },
  })
);

// Endpoint API pour envoyer des notifications push
app.post("/sendNotificationpush", (req, res) => {
  const { token, title, message } = req.body;

  // Vérification que les paramètres sont fournis
  if (!token || !title || !message) {
    return res
      .status(400)
      .json({ error: "Token, titre et message sont requis" });
  }

  // Appel au service pour envoyer la notification
  sendPushNotification(token, title, message)
    .then((response) => {
      res.status(200).json({ message: "Notification envoyée", response });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ error: "Erreur lors de l'envoi de la notification" });
    });
});

//notification socket.io
app.post("/send-notification", (req, res) => {
  const { message } = req.body;
  // Vérification de la présence du message
  if (!message) {
    return res.status(400).json({ error: "Message est requis" });
  }
  // envoie l'événement de notification à tous les clients connectés
  io.emit("notification", { message });
  res.status(200).json({ message: "Notification envoyée à tous les clients par le serveur" });
});

// Écoute des connexions des clients via WebSocket
io.on("connection", (socket) => {
  console.log("Un client est connecté");
  // Écouter un événement personnalisé 'message' par le client
  socket.on("message", (data) => {
    console.log("Message reçu :", data);
    socket.emit("response", { message: `Message bien reçu: ${data.message}` });
  });

  // Gérer la déconnexion du client
  socket.on("disconnect", () => {
    console.log("Client déconnecté");
  });
});
// Rendre les fichiers accessibles
app.use("/Public/Images", express.static("Public/Images"));
app.use("/Public/Videos", express.static("Public/Videos"));
app.use("/Public/cv", express.static("Public/cv"));

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/RihabTest")
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error while connecting to DB:", error);
  });
// Routes
app.get("/", (req, res) => {
  res.send("Hello, this is our first app");
});
//upload image et vd
app.post(
  "/upload",
  uploads.fields([{ name: "image" }, { name: "url" }, { name: "cv" }]),
  (req, res) => {
    try {
      if (!req.files) {
        return res.status(400).json({ message: "Aucun fichier sélectionné" });
      }

      const imagePath = req.files["image"]
        ? req.files["image"][0].filename
        : null;
      const videoPaths = req.files["url"]
        ? req.files["url"].map((file) => file.filename)
        : [];
      const cvPath = req.file["cv"] ? req.files["cv"][0].filename : null;

      res.json({
        message: "Fichiers uploadés avec succès",
        image: imagePath,
        videos: videoPaths,
        cv: cvPath,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Import routes
require("./routes/userRoute")(app);
require("./routes/ProfesseurRoute")(app);
require("./routes/CategorieRoute")(app);
require("./routes/ApprenantRoute")(app);
require("./routes/CoursRoute")(app);
require("./routes/QuizRoute")(app);
require("./routes/QuestionRoute")(app);
require("./routes/FeedbackRoute")(app);
require("./routes/CertificatRoute")(app);
require("./routes/AbonnementRoute")(app);
require("./routes/DemandeRoute")(app);
require("./routes/AdminRoute")(app);
require("./routes/userRoute")(app);
// Start server
server.listen(port, () => {
  console.log(`Our app is working on port ${port}`);
});