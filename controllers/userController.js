const User = require("../modeles/userModal");
const bcrypt = require("bcryptjs");

exports.createuser = async (req, res) => {
  try {
    // Vérification des doublons (utiliser await ici)
    const userExist = await User.findOne({ email: req.body.email });
    if (userExist) {
      return res.status(409).json({
        message: "Un utilisateur avec cet email existe déjà",
        existinguser: userExist,
      });
    }

    // Vérification que le mot de passe et la confirmation du mot de passe sont identiques
    if (req.body.motDePasse !== req.body.confirmmotDePasse) {
      return res.status(400).json({
        message: "Les mots de passe ne correspondent pas",
      });
    }

    // Hachage du mot de passe pour la sécurité
    const hashedPassword = await bcrypt.hash(req.body.motDePasse, 10);

    // Création du nouvel utilisateur
    const user = new User({
      nom: req.body.nom,
      email: req.body.email,
      motDePasse: hashedPassword, // Utilisation du mot de passe haché
    });

    // Sauvegarde de l'utilisateur
    const newUser = await user.save();
    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: newUser,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    res.status(500).send({
      message:
        error.message || "Erreur serveur lors de la création de l'utilisateur",
    });
  }
};

exports.findAllusers = (req, res) => {
  User.find()
    .then((users) => {
      res.send(users);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our users",
      });
    });
};
exports.findOneuser = (req, res) => {
  User.findById(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "user not found by id " + req.params.userId,
        });
      }
      res.send(user);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the user by id" + req.params.userId,
      });
    });
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params; // Récupérer l'ID de l'utilisateur à partir des paramètres de la route
    const { nom, email, motDePasse, confirmmotDePasse } = req.body;

    // Vérification que l'email n'est pas déjà utilisé par un autre utilisateur
    const userExist = await User.findOne({ email });
    if (userExist && userExist._id.toString() !== userId) {
      return res.status(409).json({
        message: "Un utilisateur avec cet email existe déjà.",
      });
    }

    // Vérification que les mots de passe correspondent
    if (motDePasse !== confirmmotDePasse) {
      return res.status(400).json({
        message: "Les mots de passe ne correspondent pas.",
      });
    }

    // Mise à jour de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { nom, email, motDePasse }, // Champs à mettre à jour
      { new: true, runValidators: true } // Renvoie l'utilisateur mis à jour
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "Utilisateur non trouvé.",
      });
    }

    res.status(200).json({
      message: "Utilisateur mis à jour avec succès.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour de l'utilisateur.",
      error: error.message,
    });
  }
};
//delete

exports.deleteUser = (req, res) => {
  User.findByIdAndDelete(req.params.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          message: "user not fount with the id " + req.params.userId,
        });
      }
      res.send({ message: "user deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the user by id" + req.params.userId,
      });
    });
};
