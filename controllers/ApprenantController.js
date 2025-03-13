const Apprenant = require("../modeles/ApprenantModal");
const fs = require("fs");
const path = require("path");
//create
exports.createapprenant = (req, res) => {
  //Vérifie si une image a été envoyée
  const imagePath = req.files["image"] ? req.files["image"][0].filename : null;

  const apprenant = new Apprenant({
    nom: req.body.nom,
    email: req.body.email,
    motDePasse: req.body.motDePasse,
    pays: req.body.pays,
    dateNaissance: req.body.dateNaissance,
    telephone: req.body.telephone,
    image: imagePath,
  });
  apprenant
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while creating the apprenant",
      });
    });
};

//getall
exports.findAllApprenant = (req, res) => {
  Apprenant.find()
    .then((apprenants) => {
      res.send(apprenants);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message || " server error while retreiving our apprenant",
      });
    });
};
//getone
exports.findOneApprenant = (req, res) => {
  Apprenant.findById(req.params.apprenantId)
    .then((apprenant) => {
      if (!apprenant) {
        return res.status(404).send({
          message: "apprenant not found by id " + req.params.apprenantId,
        });
      }
      res.send(apprenant);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the apprenant by id" +
            req.params.apprenantId,
      });
    });
};
//update
exports.updateApprenant = (req, res) => {
  //Par défaut, on garde l'ancienne image
  let imagePath = Apprenant.image;
  // Vérifier si une nouvelle image a été uploadée
  if (req.files && req.files["image"]) {
    // Supprimer l'ancienne image si elle existe
    if (Apprenant.image) {
      const oldImagePath = path.join(
        __dirname,
        "../Public/Images",
        Apprenant.image
      ); // Le chemin de l'image
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error("Erreur lors de la suppression de l'image", err);
          return res.status(500).send({
            message: "Erreur serveur lors de la suppression de l'image",
          });
        }
        console.log("Image supprimée avec succès");
      });
    }
    imagePath = req.files["image"][0].filename;
  }
  Apprenant.findByIdAndUpdate(
    req.params.apprenantId,
    {
      nom: req.body.nom,
      email: req.body.email,
      pays: req.body.pays,
      dateNaissance: req.body.dateNaissance,
      telephone: req.body.telephone,
      image: imagePath,
    },
    { new: true }
  )
    .then((apprenant) => {
      if (!apprenant) {
        return res.status(404).send({
          message: "apprenant not fount with the id " + req.params.apprenantId,
        });
      }
      res.send(apprenant);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the apprenant by id" +
            req.params.apprenantId,
      });
    });
};

//delete
exports.deleteApprenant = (req, res) => {
  Apprenant.findByIdAndDelete(req.params.apprenantId)
    .then((apprenant) => {
      if (!apprenant) {
        return res.status(404).send({
          message: "apprenant not found with ID " + req.params.apprenantId,
        });
      }
      // Vérifier si une image existe et la supprimer du dossier
      if (apprenant.image) {
        const imagePath = path.join(
          __dirname,
          "../Public/Images",
          apprenant.image
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
      res.send({ message: "apprenant deleted successfully!" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          "Server error while deleting the apprenant with ID " +
            req.params.apprenantId,
      });
    });
};
