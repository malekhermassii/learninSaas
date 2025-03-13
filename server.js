require("dotenv").config();
const express = require("express");
const app = express();
const uploads = require("./uploads");
const mongoose = require("mongoose");
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const port = 3000;
// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
// Middleware général (NE PAS inclure express.json ici)
app.use(express.urlencoded({ extended: true }));

// Middleware pour Stripe Webhooks (⚠️ doit être AVANT `express.json()`)
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
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
// Start server
app.listen(port, () => {
  console.log(`Our app is working on port ${port}`);
});
