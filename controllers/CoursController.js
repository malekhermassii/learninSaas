const {
  Course,
  Module,
  Video,
  Enrollment,
  Progression,
} = require("../modeles/CourseModal");
const Professeur = require("../modeles/ProfesseurModal");
const Apprenant = require("../modeles/ApprenantModal");
const fs = require("fs");
const path = require("path");
const Categorie = require("../modeles/CategorieModal");
const transporter = require("../emailService");
const mongoose = require("mongoose");
//const User = require("../modeles/userModal");

exports.createCourse = async (req, res) => {
  try {
    // Validation des données
    if (!req.body.nom || !req.body.categorieId) {
      return res
        .status(400)
        .json({ message: "Le nom du cours et la catégorie sont obligatoires" });
    }
    // Vérification des doublons
    const coursExist = await Course.findOne({ nom: req.body.nom });
    if (coursExist) {
      return res.status(409).json({
        message: "Un cours avec ce nom existe déjà",
        existingCourse: coursExist,
      });
    }
    // Vérifier si la catégorie existe
    const categorieExist = await Categorie.findById(req.body.categorieId);
    if (!categorieExist) {
      return res.status(404).json({ message: "Catégorie non trouvée" });
    }
    //Vérifie si une image a été envoyée
    const imagePath = req.files["image"]
      ? req.files["image"][0].filename
      : null;

    const modulesIds = []; // Tableau pour stocker les ID des modules créés
    const modules = req.body.modules || []; // On suppose que req.body.modules contient une liste de modules
    const videoIds = [];
    for (const moduleData of modules) {
      // Validation des données du module
      if (
        !moduleData.titre ||
        !moduleData.videos ||
        moduleData.videos.length === 0
      ) {
        return res.status(400).json({
          message: "Chaque module doit avoir un titre et des vidéos associées",
        });
      }

      //Vérifie si des vidéos ont été envoyées
      if (!req.files["url"] || req.files["url"].length === 0) {
        return res.status(400).json({ message: "Aucune vidéo téléchargée." });
      }

      // Création des vidéos pour ce module spécifvideosique

      for (let i = 0; i < moduleData.videos.length; i++) {
        const nouvelleVideo = new Video({
          titrevd: moduleData.videos[i].titrevd,
          duree: moduleData.videos[i].duree,
          url: req.files["url"] ? req.files["url"][i].filename : null, // Assurez-vous que l'index des fichiers correspond
        });
        // Sauvegarde de la vidéo
        const videoCreee = await nouvelleVideo.save();
        videoIds.push(videoCreee._id);
      }

      // Création du module avec ses vidéos spécifiques
      const newModule = new Module({
        titre: moduleData.titre || "Module par défaut",
        nbrVideo: videoIds.length,
        videos: videoIds, // Ajout des vidéos spécifiques à ce module
      });

      const moduleCree = await newModule.save();
      modulesIds.push(moduleCree._id); // Ajout de l'ID du module créé
    }
    // Création du cours
    const nouveauCours = new Course({
      nom: req.body.nom,
      description: req.body.description,
      categorieId: req.body.categorieId,
      //professeurId: req.user._id, // Utilisation de l'ID du professeur connecté
      image: imagePath,
      modules: modulesIds,
      professeurId: req.body.professeurId,
    });
    // Sauvegarde du cours
    const coursCree = await nouveauCours.save();
    // Mise à jour du cours avec le nouveau feedback
    await Professeur.findByIdAndUpdate(req.body.professeurId, {
      $push: { courseId: coursCree._id },
    });
    res.status(201).json({
      message: "Cours et vidéo créés avec succès",
      course: coursCree,
      module: modulesIds,
      video: videoIds,
      // Ajout des feedbacks dans la réponse
    });
  } catch (error) {
    console.error("Erreur lors de la création :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la création",
      error: error.message,
    });
  }
};
//getall
exports.findAllCourses = (req, res) => {
  Course.find()
    .populate("nom", "statut")
    .populate("categorieId", "titre")
    .then((courses) => {
      res.send(courses);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our courses",
      });
    });
};
//getone
exports.findOneCourse = (req, res) => {
  Course.findById(req.params.courseId)
    .populate("feedback_id", "rating")
    .populate("categorieId", "titre")
    .then((course) => {
      if (!course) {
        return res.status(404).send({
          message: "course not found by id " + req.params.courseId,
        });
      }
      res.send(course);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the course by id" +
            req.params.courseId,
      });
    });
};
//update
exports.updateCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // Vérification que le cours existe
    const coursExistant = await Course.findById(courseId);
    if (!coursExistant) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Mise à jour du nom du cours si fourni
    if (req.body.nom && req.body.nom !== coursExistant.nom) {
      // Vérification des doublons pour le nouveau nom
      const doublon = await Course.findOne({ nom: req.body.nom });
      if (doublon) {
        return res.status(409).json({
          message: "Un cours avec ce nom existe déjà",
          existingCourse: doublon,
        });
      }
      coursExistant.nom = req.body.nom;
    }

    // Mise à jour conditionnelle de la description
    if (req.body.description !== undefined) {
      coursExistant.description = req.body.description;
    }

    // Mise à jour de la catégorie si fournie et valide
    if (req.body.categorieId) {
      const categorieExist = await Categorie.findById(req.body.categorieId);
      if (!categorieExist) {
        return res.status(404).json({ message: "Catégorie non trouvée" });
      }
      coursExistant.categorieId = req.body.categorieId;
    }

    // Mise à jour de l'image si une nouvelle est envoyée
    if (req.files && req.files["image"] && req.files["image"].length > 0) {
      coursExistant.image = req.files["image"][0].filename;
    }

    // Mise à jour des modules
    if (req.body.modules && req.body.modules.length > 0) {
      const modulesIds = [];
      const videoIds = [];

      for (const moduleData of req.body.modules) {
        if (
          !moduleData.titre ||
          !moduleData.videos ||
          moduleData.videos.length === 0
        ) {
          return res.status(400).json({
            message:
              "Chaque module doit avoir un titre et des vidéos associées",
          });
        }

        // Vérification des vidéos envoyées
        if (!req.files["url"] || req.files["url"].length === 0) {
          return res.status(400).json({ message: "Aucune vidéo téléchargée." });
        }

        // Création des vidéos pour chaque module
        for (let i = 0; i < moduleData.videos.length; i++) {
          const nouvelleVideo = new Video({
            titrevd: moduleData.videos[i].titrevd,
            duree: moduleData.videos[i].duree,
            url: req.files["url"] ? req.files["url"][i].filename : null,
          });
          const videoCreee = await nouvelleVideo.save();
          videoIds.push(videoCreee._id);
        }

        // Création du module avec les vidéos spécifiques
        const newModule = new Module({
          titre: moduleData.titre || "Module par défaut",
          nbrVideo: videoIds.length,
          videos: videoIds, // Ajout des vidéos spécifiques au module
        });

        const moduleCree = await newModule.save();
        modulesIds.push(moduleCree._id);
      }

      // Remplacer les modules existants par les nouveaux
      coursExistant.modules = modulesIds;
    }

    // Mise à jour du professeur (si nécessaire)
    if (req.body.professeurId) {
      await Professeur.findByIdAndUpdate(req.body.professeurId, {
        $addToSet: { courseId: coursExistant._id }, // Ajout du cours à la liste des cours du professeur
      });
    }

    // Sauvegarde des modifications du cours
    const coursMisAJour = await coursExistant.save();

    res.status(200).json({
      message: "Cours mis à jour avec succès",
      course: coursMisAJour,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour",
      error: error.message,
    });
  }
};

//delete
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Vérification de l'existence du cours
    const course = await Course.findById(courseId).populate("modules");
    if (!course) {
      return res
        .status(404)
        .json({ message: `Cours non trouvé avec l'ID ${courseId}` });
    }

    // Suppression des modules associés
    if (course.modules && course.modules.length > 0) {
      for (const module of course.modules) {
        // Suppression des vidéos associées à chaque module
        if (module.videos && module.videos.length > 0) {
          for (const videoId of module.videos) {
            const video = await Video.findById(videoId);
            if (video && video.url) {
              let videoPath = video.url; // Si video.url est un tableau, nous devons récupérer le premier élément
              if (Array.isArray(videoPath)) {
                videoPath = videoPath[0]; // Prendre le premier élément du tableau
              }
              const fullVideoPath = path.join(
                __dirname,
                "../Public/Videos",
                videoPath
              );

              if (fs.existsSync(fullVideoPath)) {
                await fs.promises.unlink(fullVideoPath);
                console.log("Vidéo supprimée:", fullVideoPath);
              }
            }
          }
          // Suppression des vidéos dans la base de données
          await Video.deleteMany({ _id: { $in: module.videos } });
        }
        // Suppression du module
        await Module.findByIdAndDelete(module._id);
      }
    }

    // Suppression de l'image associée au cours
    if (course.image) {
      const imagePath = path.join(__dirname, "../Public/Images", course.image);
      try {
        await fs.promises.unlink(imagePath);
        console.log("Image supprimée avec succès");
      } catch (err) {
        console.error("Erreur lors de la suppression de l'image", err);
      }
    }

    // Suppression du cours dans la base de données
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({
      message: "Cours, modules et vidéos associés supprimés avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression du cours",
      error: error.message,
    });
  }
};

exports.approveCourse = async (req, res) => {
  try {
    // Recherche du cours par ID
    const course = await Course.findById(req.params.courseId);

    // Vérification si le cours existe
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }
    // Recherche du professeur associé au cours
    const professeur = await Professeur.findById(course.professeurId); // On suppose que `professeurId` est une référence au professeur
    // Vérifier si le professeur existe
    if (!professeur) {
      return res.status(404).json({ message: "Professeur non trouvé" });
    }
    // Mise à jour du statut du cours à "accepted"
    course.statut = "accepted";
    await course.save();

    // Options de l'email
    const mailOptions = {
      from: "rihabchebil10@gmail.com",
      to: professeur.email, // L'email du professeur associé au cours
      subject: "Votre cours a été approuvé",
      html: `
        <p>Bonjour,</p>
        <p>Félicitations ! Votre cours intitulé <strong>${course.nom}</strong> a été approuvé.</p>
        <p>Vous pouvez maintenant continuer avec la planification et les prochaines étapes.</p>
        <p>Merci pour votre participation.</p>
        <p>Cordialement,</p>
        <p>L'équipe administrative</p>
      `,
    };
    // Envoi de l'email
    await transporter.sendMail(mailOptions);
    // Réponse au client
    res.json({ message: "Cours approuvé et email envoyé", course });
  } catch (error) {
    console.error("Erreur lors de l'approbation du cours :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

//refuser cours
exports.refuseCourse = async (req, res) => {
  try {
    // Recherche du cours par ID
    const course = await Course.findById(req.params.courseId).populate(
      "professeurId"
    );

    // Vérification si le cours existe
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Vérification si le cours est déjà rejeté
    if (course.statut === "rejected") {
      return res.status(400).json({ message: "Ce cours a déjà été refusé." });
    }

    // Recherche du professeur associé au cours
    const professeur = await Professeur.findById(course.professeurId); // On suppose que `professeurId` est une référence au professeur
    // Vérifier si le professeur existe
    if (!professeur) {
      return res.status(404).json({ message: "Professeur non trouvé" });
    }
    // Mise à jour du statut du cours

    course.statut = "rejected";
    await course.save();

    // Configuration de l'email
    const mailOptions = {
      from: "rihabchebil10@gmail.com",
      to: professeur.email, // Email du professeur associé
      subject: "Refus de votre cours",
      html: `
        <p>Bonjour ${professeur.nom},</p>
        <p>Nous vous remercions pour votre proposition de cours intitulé <strong>${course.nom}</strong>.</p>
        <p>Après evaluation, nous regrettons de vous informer que ce cours ne répond pas à nos besoins actuels.</p>
        <p>Nous vous encourageons à proposer d'autres contenus qui pourraient mieux correspondre à notre programme.</p>
        <p>Merci pour votre compréhension.</p>
        <p>Cordialement,</p>
        <p>L'équipe administrative</p>
      `,
    };
    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    res.json({
      message: "Cours refusé avec succès et notification envoyée.",
      course,
    });
  } catch (error) {
    console.error("Erreur lors du refus du cours :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Route pour rechercher les cours par nom
exports.search = async (req, res) => {
  try {
    const { nom } = req.query; // Récupère le terme de recherche à partir de la query string
    if (!nom) {
      return res.status(400).json({ message: "Le nom du cours est requis" });
    }

    // Recherche des cours qui contiennent le terme dans leur nom
    const courses = await Course.find({
      nom: { $regex: nom, $options: "i" }, // Recherche insensible à la casse
    });

    if (courses.length === 0) {
      return res.status(404).json({ message: "Aucun cours trouvé" });
    }

    // Retourne les cours trouvés
    res.status(200).json(courses);
  } catch (error) {
    console.error("Erreur lors de la recherche des cours:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la recherche",
      error: error.message,
    });
  }
};

// Route pour inscrire un user à un cours
exports.enroll = async (req, res) => {
  try {
    const { apprenantId, courseId } = req.params;

    // Vérifier si l'apprenant existe
    const apprenant = await Apprenant.findById(apprenantId);
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé." });
    }
    // Vérifier si le cours existe
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé." });
    }
    // Vérifier si l'apprenant est déjà inscrit
    const existingEnrollment = await Enrollment.findOne({
      apprenantId,
      courseId,
    });
    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "L'apprenant est déjà inscrit à ce cours." });
    }

    // Ajouter l'inscription
    const enrollment = new Enrollment({ apprenantId, courseId });
    await enrollment.save();

    // Mettre à jour la liste des étudiants inscrits dans Course
    course.apprenantEnroll.push(apprenantId);
    course.enrolledCount = course.apprenantEnroll.length; // Met à jour le nombre d'inscrits
    await course.save();

    res.status(201).json({
      message: "Inscription réussie !",
      enrolledCount: course.enrolledCount,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error); // Affichage de l'erreur dans la console
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message || error,
    });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { courseId, moduleId, videoId, apprenantId } = req.params;

    // Vérification de la validité des ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(moduleId) ||
      !mongoose.Types.ObjectId.isValid(videoId) ||
      !mongoose.Types.ObjectId.isValid(apprenantId)
    ) {
      return res.status(400).json({ message: "ID invalide fourni" });
    }

    // Vérifier si le cours existe et récupérer ses modules
    const course = await Course.findById(courseId).populate("modules");
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }

    // Vérifier si le module appartient bien au cours
    const module = course.modules.find((mod) => mod._id.equals(moduleId));
    if (!module) {
      return res.status(400).json({ message: "Module invalide pour ce cours" });
    }

    // Récupérer le module avec ses vidéos
    const moduleDetails = await Module.findById(moduleId).populate("videos");
    if (!moduleDetails || !moduleDetails.videos) {
      return res
        .status(400)
        .json({ message: "Module introuvable ou sans vidéos" });
    }

    // Vérifier si la vidéo appartient bien au module
    if (!moduleDetails.videos.some((v) => v._id.equals(videoId))) {
      return res.status(400).json({ message: "Vidéo invalide pour ce module" });
    }

    // Vérification de la progression de l'apprenant pour ce cours
    let progression = await Progression.findOne({ apprenantId, courseId });

    if (!progression) {
      progression = new Progression({
        apprenantId,
        courseId,
        modules: [],
        complet: false,
      });
    }

    // Vérification de la progression pour ce module
    let moduleProgress = progression.modules.find((m) =>
      m.moduleId.equals(moduleId)
    );

    if (!moduleProgress) {
      moduleProgress = {
        moduleId,
        videosCompletees: [],
        progressionModule: 0,
      };
      progression.modules.push(moduleProgress);
    }

    // Ajout de la vidéo aux vidéos complétées si elle n'y est pas déjà
    if (!moduleProgress.videosCompletees.some((v) => v.equals(videoId))) {
      moduleProgress.videosCompletees.push(videoId);
    }

    // Calcul de la progression du module
    const totalVideos = moduleDetails.videos.length;
    moduleProgress.progressionModule =
      totalVideos > 0
        ? Math.round(
            (moduleProgress.videosCompletees.length / totalVideos) * 100
          )
        : 0;

    // Calcul de la progression globale du cours
    const totalModules = course.modules.length;
    const completedModules = progression.modules.filter(
      (m) => m.videosCompletees.length === moduleDetails.videos.length
    ).length;

    progression.progressionCours =
      totalModules > 0
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

    // Vérification si tous les modules sont complétés
    progression.complet = completedModules === totalModules;

    // Sauvegarde de la progression
    await progression.save();

    // Réponse avec la progression calculée
    res.json({
      message: "Progression mise à jour avec succès",
      progressionCours: progression.progressionCours,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error);
    res
      .status(500)
      .json({ message: "Une erreur s'est produite", error: error.message });
  }
};

//pour afficher la progression de chaque cours
exports.getProgression= async (req, res) => {
  try {
    const { userId } = req.user; // Récupère l'ID de l'apprenant du token

    // Récupère les progressions de l'apprenant
    const progressions = await Progression.find({ apprenantId: userId }).populate("courseId");

    if (!progressions || progressions.length === 0) {
      return res.status(404).json({ message: "Aucune progression trouvée pour cet apprenant." });
    }

    res.json(progressions); // Retourne les progressions
  } catch (error) {
    console.error("Erreur lors de la récupération de la progression:", error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

