const mongoose = require("mongoose");
const Apprenant = require("../modeles/ApprenantModal");
const Abonnement = require("../modeles/AbonnementModal");
const Certificat = require("../modeles/CertificatModal");
const { Course, Module } = require("../modeles/CourseModal");
const fs = require("fs");
const path = require("path");

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


