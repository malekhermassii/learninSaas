const Professeur = require("../modeles/ProfesseurModal");
//const User = require("../modeles/userModal");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Fonction pour générer un JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

exports.registerProfessor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await Professeur.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Un compte existe déjà avec cet e-mail." });
    }

    // Créer l'utilisateur avec le rôle "professeur"
    const professeur = new Professeur({ name, email, password });
    await professeur.save();

    // Générer un token
    const token = generateToken(professeur._id);

    // Configurer Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Contenu de l'e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Votre compte professeur a été créé",
      text: `Bonjour ${name},\n\nVotre compte professeur a été créé avec succès.\n\nIdentifiants de connexion:\nEmail: ${email}\nMot de passe temporaire: ${password}\n\nMerci de modifier votre mot de passe après connexion.\n\nCordialement,\nL'professeuristration`,
    };

    // Envoyer l'e-mail
    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Compte professeur créé et e-mail envoyé avec succès.",
      userId: professeur._id,
      name: professeur.name,
      email: professeur.email,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création du compte." });
  }
};
//login prof
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // // Look up the user in the database by their email, waiting for the result.
    const professeur = await Professeur.findOne({ email });
    console.log(professeur);
    // Check if no professeur was found or if the password is incorrect.
    if (!professeur || !(await professeur.comparePassword(password))) {
      console.log("Incorrect password for email:", password);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Comparer le mot de passe saisi avec le mot de passe haché dans la base de données
    const isMatch = await professeur.comparePassword(password);

    // Si le mot de passe ne correspond pas
    if (!isMatch) {
      console.log("Mot de passe incorrect pour:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate a JWT token for the professeur using their professeur ID.
    const token = generateToken(professeur._id);

    // Store user session
    req.session.userId = professeur._id;

    res.json({
      userId: professeur._id,
      name: professeur.name,
      email: professeur.email,
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
    //  // Clear the session cookie (`connect.sid`) that was stored in the professeur's browser.
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
};
//update profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body); // Obtenir les champs à mettre à jour
    const allowedUpdates = [
      "name",
      "email",
      "password",
      "image",
      "dateNaissance",
      "telephone",
      "specialite",
    ];

    // Vérifier que les champs à mettre à jour sont valides
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).json({ message: "Mise à jour invalide" });
    }

    // Trouver l'professeur par ID
    const professeur = await Professeur.findById(req.user.userId);
    console.log("Image après mise à jour :", professeur.image);
    if (!professeur)
      return res.status(404).json({ message: "professeur non trouvé" });

    // Gestion de l'upload d'image
    if (req.files && req.files["image"]) {
      console.log("Fichiers reçus :", req.files);
      // Supprimer l'ancienne image si elle existe
      if (professeur.image) {
        const oldImagePath = path.join(
          __dirname,
          "../Public/Images",
          professeur.image
        );
        fs.unlink(oldImagePath, (err) => {
          if (err)
            console.error("Erreur lors de la suppression de l'image :", err);
        });
      }

      // Stocker la nouvelle image
      professeur.image = req.files["image"][0].filename;
    }

    // Mise à jour des autres champs
    updates.forEach((update) => {
      if (update === "password") {
        // Hacher le nouveau mot de passe
        professeur.password = bcrypt.hashSync(req.body.password, 10);
      } else {
        professeur[update] = req.body[update];
      }
    });

    console.log("Nouvelle image sauvegardée :", professeur.image);
    // Sauvegarder les données mises à jour
    await professeur.save();

    // Retourner les informations mises à jour au front
    res.json({
      userId: professeur._id,
      name: professeur.name,
      email: professeur.email,
      image: professeur.image,
      specialite: professeur.specialite, // Renvoi de la nouvelle image
      dateNaissance: professeur.dateNaissance,
      telephone: professeur.telephone,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Échec de la mise à jour", error: error.message });
  }
};
//getall
exports.findAllProfesseur = (req, res) => {
  Professeur.find()
    .then((professeurs) => {
      res.send(professeurs);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message || " server error while retreiving our professeurs",
      });
    });
};
//getone
exports.findOneprofesseur = (req, res) => {
  Professeur.findById(req.params.professeurId)
    .then((professeur) => {
      if (!professeur) {
        return res.status(404).send({
          message: "professeur not found by id " + req.params.professeurId,
        });
      }
      res.send(professeur);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the professeur by id" +
            req.params.professeurId,
      });
    });
};
//update
exports.updateProfesseur = (req, res) => {
  Professeur.findByIdAndUpdate(
    req.params.professeurId,
    {
      name: req.body.name,
      email: req.body.email,
      motDePasse: req.body.motDePasse,
    },
    { new: true }
  )
    .then((professeur) => {
      if (!professeur) {
        return res.status(404).send({
          message:
            "professeur not fount with the id " + req.params.professeurId,
        });
      }
      res.send(professeur);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the professeur by id" +
            req.params.professeurId,
      });
    });
};

//delete
exports.deleteProfesseur = (req, res) => {
  Professeur.findByIdAndDelete(req.params.professeurId)
    .then((professeur) => {
      if (!professeur) {
        return res.status(404).send({
          message:
            "professeur not fount with the id " + req.params.professeurId,
        });
      }

      // Vérifier si une image existe et la supprimer du dossier
      if (professeur.image) {
        const imagePath = path.join(
          __dirname,
          "../Public/Images",
          professeur.image
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
      res.send({ message: "professeur deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the professeur by id" +
            req.params.professeurId,
      });
    });
};
