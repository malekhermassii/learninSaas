const Professeur = require("../modeles/ProfesseurModal");
const fs = require("fs");
const path = require("path");
// Créer un professeur
exports.createProfesseur = async (req, res) => {
  try {
    // Vérification des doublons
    const professeurExist = await Professeur.findOne({ email: req.body.email });
    if (professeurExist) {
      return res.status(409).json({
        message: "Un professeur avec cet email existe déjà",
        existingProfesseur: professeurExist,
      });
    }
    //Vérifie si une image a été envoyée
    const imagePath = req.files["image"]
      ? req.files["image"][0].filename
      : null;
    // Création du professeur
    const professeur = new Professeur({
      nom: req.body.nom,
      email: req.body.email,
      motDePasse: req.body.motDePasse,
      pays: req.body.pays,
      dateNaissance: req.body.dateNaissance,
      telephone: req.body.telephone,
      image: imagePath,
      specialite: req.body.specialite,
      nbEtudiants: 0,
    });

    // Sauvegarde dans la base de données
    const nouveauProfesseur = await professeur.save();
    // Réponse avec les données créées
    res.status(201).json(nouveauProfesseur);
  } catch (error) {
    res.status(500).json({
      message:
        error.message || "Erreur serveur lors de la création du professeur",
    });
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
      nom: req.body.nom,
      email: req.body.email,
      motDePasse: req.body.motDePasse,
      pays: req.body.pays,
      dateNaissance: req.body.dateNaissance,
      telephone: req.body.telephone,
      image: req.body.image,
      specialite: req.body.specialite,
      nbEtudiants: req.body.nbEtudiants,
    
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

