const Categorie = require("../modeles/CategorieModal");
const fs = require("fs");
const path = require("path");
//create
exports.createCategorie = (req, res) => {
  //Vérifie si une image a été envoyée
  const imagePath = req.files["image"] ? req.files["image"][0].filename : null;
  const categorie = new Categorie({
    titre: req.body.titre,
    image: imagePath,
  });
  categorie
    .save()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while creating the categorie",
      });
    });
};

//getall
exports.findAllCategorie = (req, res) => {
  Categorie.find()
    .then((categories) => {
      res.send(categories);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message || " server error while retreiving our categories",
      });
    });
};
//getone
exports.findOneCategorie = (req, res) => {
  Categorie.findById(req.params.categorieId)
    .then((categorie) => {
      if (!categorie) {
        return res.status(404).send({
          message: "categorie not found by id " + req.params.categorieId,
        });
      }
      res.send(categorie);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the categorie by id" +
            req.params.categorieId,
      });
    });
};
//update
exports.updateCategorie = (req, res) => {
  // Par défaut, on garde l'ancienne image
  let imagePath = Categorie.image;
  // Vérifier si une nouvelle image a été uploadée
  if (req.files && req.files["image"]) {
    // Supprimer l'ancienne image si elle existe
    if (Categorie.image) {
      const oldImagePath = path.join(
        __dirname,
        "../Public/Images",
        Categorie.image
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Supprimer l'ancienne image
      }
    }
    // Mettre à jour l'image avec la nouvelle image téléchargée
    imagePath = req.files["image"][0].filename;
  }
  Categorie.findByIdAndUpdate(
    req.params.categorieId,
    {
      titre: req.body.titre,
      image: imagePath,
    },
    { new: true }
  )
    .then((Categorie) => {
      if (!Categorie) {
        return res.status(404).send({
          message: "Categorie not fount with the id " + req.params.categorieId,
        });
      }
      res.send(Categorie);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the categorie by id" +
            req.params.categorieId,
      });
    });
};

//delete
exports.deleteCategorie = (req, res) => {
  Categorie.findByIdAndDelete(req.params.categorieId)
    .then((categorie) => {
      if (!categorie) {
        return res.status(404).send({
          message: "categorie not found with ID " + req.params.categorieId,
        });
      }
      // Vérifier si une image existe et la supprimer du dossier
      if (categorie.image) {
        const imagePath = path.join(
          __dirname,
          "../Public/Images",
          categorie.image
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
      res.send({ message: "categorie deleted successfully!" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          "Server error while deleting the categorie with ID " +
            req.params.categorieId,
      });
    });
};
