const Admin = require("../modeles/AdminModal");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d", // Le token expire après 1 jour
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingadmin = await Admin.findOne({ email });
    if (existingadmin) {
      return res.status(400).json({ message: "admin already exists" });
    }

    const admin = new Admin({ name, email, password });
    await admin.save();

    const token = generateToken(admin._id);
    res.status(201).json({
      userId: admin._id,
      name: admin.name,
      email: admin.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // // Look up the admin in the database by their email, waiting for the result.
    const admin = await Admin.findOne({ email });
    // Check if no admin was found or if the password is incorrect.
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate a JWT token for the admin using their admin ID.
    const token = generateToken(admin._id);

    // Store admin session
    req.session.userId = admin._id;

    res.json({
      userId: admin._id,
      name: admin.name,
      email: admin.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    // Destroy the session on the server. The session data is removed.
    if (err) return res.status(500).json({ message: "Logout failed" });
    // connect.sid is the default name of the session cookie used by the Express session middleware to store session data on the client-side
    //  // Clear the session cookie (`connect.sid`) that was stored in the admin's browser.
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body); // Obtenir les champs à mettre à jour
    const allowedUpdates = ["name", "email", "password", "image"];

    // Vérifier que les champs à mettre à jour sont valides
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).json({ message: "Mise à jour invalide" });
    }

    // Trouver l'admin par ID
    const admin = await Admin.findById(req.user.userId);
    console.log("Image après mise à jour :", admin.image);
    if (!admin) return res.status(404).json({ message: "Admin non trouvé" });

    // Gestion de l'upload d'image
    if (req.files && req.files["image"]) {
      console.log("Fichiers reçus :", req.files);
      // Supprimer l'ancienne image si elle existe
      if (admin.image) {
        const oldImagePath = path.join(
          __dirname,
          "../Public/Images",
          admin.image
        );
        fs.unlink(oldImagePath, (err) => {
          if (err)
            console.error("Erreur lors de la suppression de l'image :", err);
        });
      }

      // Stocker la nouvelle image
      admin.image = req.files["image"][0].filename;
    }

    // Mise à jour des autres champs
    updates.forEach((update) => {
      if (update === "password") {
        // Hacher le nouveau mot de passe
        admin.password = bcrypt.hashSync(req.body.password, 10);
      } else {
        admin[update] = req.body[update];
      }
    });

    console.log("Nouvelle image sauvegardée :", admin.image);
    // Sauvegarder les données mises à jour
    await admin.save();

    // Retourner les informations mises à jour au front
    res.json({
      userId: admin._id,
      name: admin.name,
      email: admin.email,
      image: admin.image,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Échec de la mise à jour", error: error.message });
  }
};
