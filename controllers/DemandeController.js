const Demande = require("../modeles/DemandeModal");
const transporter = require("../emailService");
exports.createdemande = async (req, res) => {
  try {
    // Vérification des doublons (utiliser await ici)
    const demandeExist = await Demande.findOne({ email: req.body.email });
    if (demandeExist) {
      return res.status(409).json({
        message: "Un utilisateur avec cet email existe déjà",
        existinguser: demandeExist,
      });
    }
    const cvPath = req.files["cv"] ? req.files["cv"][0].filename : null;
    if (!cvPath) {
      return res.status(400).json({ error: "Le fichier CV est requis" });
    }
    // Création du nouvel demande
    const demande = new Demande({
      name: req.body.name,
      email: req.body.email,
      country: req.body.country,
      speciality: req.body.speciality,
      cv: cvPath,
      birthDate: req.body.birthDate,
      topic: req.body.topic,
    });

    // Sauvegarde de l'utilisateur
    const newDemande = await demande.save();
    res.status(201).json({
      message: "demande créé avec succès",
      demande: newDemande,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la demande :", error);
    res.status(500).send({
      message: error.message || "Erreur serveur lors de la création de demande",
    });
  }
};

exports.accepterdemande = async (req, res) => {
  const { demandeId } = req.params;
  const { dateEntretien } = req.body;
  try {
    // Recherche de la demande par ID
    const demande = await Demande.findById(demandeId);
    if (!demande) {
      return res.status(404).json({ message: "Demande non trouvée" });
    }
    // Vérifier que la date d'entretien est fournie
    if (!dateEntretien) {
      return res
        .status(400)
        .json({
          message:
            "La date d'entretien est obligatoire pour accepter la demande.",
        });
    }
    // Mise à jour du statut de la demande et ajout de la date d'entretien
    demande.statut = "acceptée";
    demande.dateEntretien = dateEntretien;
    await demande.save(); // Sauvegarder la demande mise à jour
    // Options de l'email
    const mailOptions = {
      from: "rihabchebil10@gmail.com",
      to: demande.email,
      subject: "Confirmation de votre entretien",
      html: `
          <p>Bonjour,</p>
          <p>Votre demande a été acceptée. Vous devez organiser un entretien programmé à la date suivante :</p>
          <ul>
              <li><strong>Date d'entretien :</strong> ${new Date(
                dateEntretien
              ).toLocaleString("fr-FR")}</li>
          </ul>
          <p>Merci de prendre les dispositions nécessaires.</p>
          <p>Cordialement,</p>
          <p>L'équipe administrative</p>
      `,
    };
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    // Réponse au client
    res.json({ message: "Demande acceptée et email envoyé", demande });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la demande :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

//refuser demande
exports.refusedemande = async (req, res) => {
  try {
    // Recherche du demande par ID
    const demande = await Demande.findById(req.params.demandeId);
    // Vérification si le demande existe
    if (!demande) {
      return res.status(404).json({ message: "demande non trouvé" });
    }
    // Mise à jour du statut du demande
    demande.statut = "rejected";
    await demande.save();
    // Options de l'email
    const mailOptions = {
      from: "rihabchebil10@gmail.com",
      to: demande.email,
      subject: "Refus de votre demande",
      html: `
        <p>Bonjour,</p>
        <p>Nous regrettons de vous informer que votre demande a été rejetée. Nous vous encourageons à essayer à nouveau dans le futur.</p>
        <p>Merci pour votre compréhension.</p>
        <p>Cordialement,</p>
        <p>L'équipe administrative</p>
      `,
    };
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    res.json({ message: "demande rejeté", demande });
  } catch (error) {
    console.error("Erreur lors de l'approbation du demande :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


exports.findAlldemandes = (req, res) => {
  Demande.find()
    .then((demandes) => {
      res.send(demandes);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our demandes",
      });
    });
};
exports.findOneuser = (req, res) => {
  Demande.findById(req.params.userId)
    .then((demande) => {
      if (!demande) {
        return res.status(404).send({
          message: "demande not found by id " + req.params.demandeId,
        });
      }
      res.send(demande);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the demande by id" + req.params.demandeId,
      });
    });
};


//delete
exports.deletedemande = (req, res) => {
  Demande.findByIdAndDelete(req.params.demandeId)
    .then((demande) => {
      if (!demande) {
        return res.status(404).send({
          message: "demande not fount with the id " + req.params.demandeId,
        });
      }
      res.send({ message: "demande deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the demande by id" + req.params.demandeId,
      });
    });
};
