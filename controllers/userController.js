const User = require("../modeles/userModal");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Helper function to generate JWT
const generateToken = (userId) => {
  // we use the jwt.sign to generate a json web token
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    // The token will expire in 1 day
    expiresIn: "1d",
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      userId: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // // Look up the user in the database by their email, waiting for the result.
    const user = await User.findOne({ email });
    // Check if no user was found or if the password is incorrect.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate a JWT token for the user using their user ID.
    const token = generateToken(user._id);

    // Store user session
    req.session.userId = user._id;

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
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
    //  // Clear the session cookie (`connect.sid`) that was stored in the user's browser.
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      "name",
      "email",
      "password",
      "image",
      "dateNaissance",
      "telephone",
    ];

    // Vérifier si toutes les clés fournies sont autorisées
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).json({ message: "Invalid updates" });
    }

    // Récupérer l'utilisateur connecté
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Gestion de l'upload d'image
    if (req.files && req.files["image"]) {
      console.log("Fichiers reçus :", req.files);
      // Supprimer l'ancienne image si elle existe
      if (user.image) {
        const oldImagePath = path.join(
          __dirname,
          "../Public/Images",
          user.image
        );
        fs.unlink(oldImagePath, (err) => {
          if (err)
            console.error("Erreur lors de la suppression de l'image :", err);
        });
      }

      // Stocker la nouvelle image
      user.image = req.files["image"][0].filename;
    }

    // Mise à jour des autres champs
    updates.forEach((update) => {
      if (update === "password") {
        // Hacher le nouveau mot de passe
        user.password = bcrypt.hashSync(req.body.password, 10);
      } else {
        user[update] = req.body[update];
      }
    });

    // Sauvegarder l'utilisateur mis à jour
    await user.save();

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      image: user.image, // Renvoi de la nouvelle image
      dateNaissance: user.dateNaissance,
      telephone: user.telephone,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};


//getall
exports.findAllusers = (req, res) => {
  User.find()
    .then((users) => {
      res.send(users);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message || " server error while retreiving our users",
      });
    });
};
//delete
exports.deleteuser = (req, res) => {
  User.findByIdAndDelete(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message:
            "user not fount with the id " + req.params.userId,
        });
      }

      // Vérifier si une image existe et la supprimer du dossier
      if (user.image) {
        const imagePath = path.join(
          __dirname,
          "../Public/Images",
          user.image
        ); // Le chemin de l'image
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Erreur lors de la suppression de l'image", err);
            return res.status(500).send({
              message: "Erreur serveur lors de la suppression de l'image",
            });
          }
          console.log("Image supprimée avec succès");
        });
      }
      res.send({ message: "user deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the user by id" +
            req.params.userId,
      });
    });
};