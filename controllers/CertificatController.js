const Certificat = require("../modeles/CertificatModal");
//getall
exports.findAllCertificat = (req, res) => {
  Certificat.find()
    .populate("apprenant_id", "nom")
    .populate("courseId", "nom")
    .then((certificats) => {
      console.log(certificats); // 🔍 Vérifier si les données sont bien récupérées
      res.send(certificats);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          "Erreur serveur lors de la récupération des certificats",
      });
    });
};

//getone
exports.findOnecertificat = (req, res) => {
  Certificat.findById(req.params.certificatId)
    .populate("apprenant_id", "nom")
    .populate("courseId", "nom")
    .then((certificat) => {
      if (!certificat) {
        return res.status(404).send({
          message: "certificat not found by id " + req.params.certificatId,
        });
      }
      res.send(certificat);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the certificat by id" +
            req.params.certificatId,
      });
    });
};


