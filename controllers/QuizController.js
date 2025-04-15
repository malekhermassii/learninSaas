const { Quiz, QuestionQuiz } = require("../modeles/QuizModal");
const Certificat = require("../modeles/CertificatModal");
const Apprenant = require("../modeles/ApprenantModal");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { Course } = require("../modeles/CourseModal");

exports.createQuiz = async (req, res) => {
  const { courseId } = req.body;
  const cours = await Course.findById(courseId);
  if (!cours) return res.status(404).json({ message: "Cours non trouvé" });

  // Vérification des doublons
  const QuizExist = await Quiz.findOne({ courseId: req.body.courseId });
  if (QuizExist) {
    return res.status(409).json({
      message: "Un Quiz avec ce cours existe déjà",
      existingQuize: QuizExist,
    });
  }
  try {
    // Vérification du nombre de questions (max 20)
    if (req.body.questionQuiz_id.length !== 20) {
      return res.status(400).json({
        message: "Le quiz doit contenir exactement 20 questions.",
      });
    }
    // Création du Quiz
    const nouveauquiz = new Quiz({
      courseId: courseId,
      resultats: [], // Initialisation des résultats
      questionQuiz_id: [],
    });

    // Sauvegarde du quiz
    const quizCree = await nouveauquiz.save();

    // Vérification des questions et options
    if (!req.body.questionQuiz_id || req.body.questionQuiz_id.length === 0) {
      return res.status(400).json({
        message: "Aucune question fournie pour le quiz.",
      });
    }
    // Traitement de chaque question
    for (const questionData of req.body.questionQuiz_id) {
      if (
        !questionData.question ||
        !questionData.options ||
        !questionData.reponseCorrecte
      ) {
        return res.status(400).json({
          message:
            "Chaque question doit avoir un texte, des options et une réponse correcte.",
        });
      }
      // Création de la question
      const nouvelleQuestion = new QuestionQuiz({
        question: questionData.question,
        options: questionData.options,
        reponseCorrecte: questionData.reponseCorrecte,
        quizId: quizCree._id,
      });

      // Sauvegarde de la question
      const questionCreee = await nouvelleQuestion.save();
      // Ajouter l'ID de la question au quiz
      quizCree.questionQuiz_id.push(questionCreee._id);
    }
    // Sauvegarde finale du quiz avec les questions ajoutées
    await quizCree.save();
    // Mise à jour du cours pour ajouter le quiz
    await Course.findByIdAndUpdate(req.body.courseId, {
      $set: { quizId: quizCree._id }, // Ajoute l'ID du quiz dans le id des quiz du cours
    });
    // Réponse de succès
    res.status(201).json({
      message: "Quiz et questions créés avec succès",
      quiz: quizCree,
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
exports.findAllQuizs = (req, res) => {
  Quiz.find()
    .then((quizs) => {
      res.send(quizs);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our quizs",
      });
    });
};

//getone
exports.findOneQuiz = (req, res) => {
  Quiz.findById(req.params.quizId)
    .then((quiz) => {
      if (!quiz) {
        return res.status(404).send({
          message: "quiz not found by id " + req.params.quizId,
        });
      }
      res.send(quiz);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the quiz by id" + req.params.quizId,
      });
    });
};

//update

exports.updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const { courseId, questionQuiz_id } = req.body;

    // Vérification de l'existence du quiz à mettre à jour
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }

    // Si un nouveau cours est fourni, vérification et mise à jour
    if (courseId) {
      const cours = await Course.findById(courseId);
      if (!cours) {
        return res.status(404).json({ message: "Cours non trouvé" });
      }
      quiz.courseId = courseId;
    }

    // Mise à jour des questions si elles sont fournies
    if (questionQuiz_id) {
      if (!Array.isArray(questionQuiz_id)) {
        return res
          .status(400)
          .json({ message: "Les questions doivent être un tableau." });
      }
      if (questionQuiz_id.length > 20) {
        return res.status(400).json({
          message: "Le quiz ne peut pas contenir plus de 20 questions.",
        });
      }

      // Suppression des questions existantes associées au quiz
      await QuestionQuiz.deleteMany({ quizId: quiz._id });
      // Réinitialisation du tableau des questions du quiz
      quiz.questionQuiz_id = [];

      // Création et sauvegarde de chacune des nouvelles questions
      for (const questionData of questionQuiz_id) {
        if (
          !questionData.question ||
          !questionData.options ||
          !questionData.reponseCorrecte
        ) {
          return res.status(400).json({
            message:
              "Chaque question doit avoir un texte, des options et une réponse correcte.",
          });
        }

        const nouvelleQuestion = new QuestionQuiz({
          question: questionData.question,
          options: questionData.options,
          reponseCorrecte: questionData.reponseCorrecte,
          quizId: quiz._id,
        });

        const questionCreee = await nouvelleQuestion.save();
        quiz.questionQuiz_id.push(questionCreee._id);
      }
    }

    // Sauvegarde du quiz mis à jour
    const quizUpdated = await quiz.save();

    // Mise à jour du cours pour lier le quiz (si courseId est fourni)
    if (courseId) {
      await Course.findByIdAndUpdate(courseId, { $set: { quizId: quiz._id } });
    }

    res.status(200).json({
      message: "Quiz mis à jour avec succès",
      quiz: quizUpdated,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du quiz :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour du quiz",
      error: error.message,
    });
  }
};

//delete
exports.deletequiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Vérification de l'existence du quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res
        .status(404)
        .json({ message: `quiz non trouvé avec l'ID ${quizId}` });
    }

    // Suppression des question associées
    if (quiz.questionQuiz_id && quiz.questionQuiz_id.length > 0) {
      await QuestionQuiz.deleteMany({ _id: { $in: quiz.questionQuiz_id } });
    }

    // Suppression du quiz
    await Quiz.findByIdAndDelete(quizId);

    res.status(200).json({
      message: "QUIZ et ses QUESTIONS associés supprimés avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({
      message: "Erreur serveur lors de la suppression du quiz",
      error: error.message,
    });
  }
};

//passer quiz

exports.passerQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { reponses, apprenant_id } = req.body;
    // Récupérer le quiz
    const quiz = await Quiz.findById(quizId).populate(
      "questionQuiz_id courseId"
    );
    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé." });
    }
    // Calcul du score
    let score = 0;
    quiz.questionQuiz_id.forEach((question) => {
      if (reponses[question._id] === question.reponseCorrecte) {
        score += 1;
      }
    });
    // Vérifier si l'apprenant a déjà un score
    const index = quiz.resultats.findIndex(
      (res) => res.apprenant_id.toString() === apprenant_id
    );
    if (index !== -1) {
      quiz.resultats[index].score = score; // Mise à jour du score existant
    } else {
      quiz.resultats.push({ apprenant_id, score }); // Ajouter un nouveau score
    }
    await quiz.save(); // Sauvegarde du score

    // Récupérer le nom de l'apprenant depuis la base de données
    const apprenant = await Apprenant.findById(apprenant_id); // Récupérer apprenant
    if (!apprenant) {
      return res.status(404).json({ message: "Apprenant non trouvé." });
    }
    if (score >= 17) {
      let certificat = await Certificat.findOne({
        apprenant_id,
        courseId: quiz.courseId,
      });

      if (!certificat) {
        certificat = new Certificat({
          apprenant_id,
          courseId: quiz.courseId,
          date_obtention: new Date(),
        });
        await certificat.save();
        await Apprenant.findByIdAndUpdate(req.body.apprenant_id, {
          $push: { certificat_id: certificat._id },
        });
      }
      return res.status(200).json({
        message:
          "Félicitations ! Vous avez réussi le quiz. Téléchargez votre certificat.",
        score,
        certificat: {
          id: certificat._id,
          apprenant_nom: apprenant.nom, // Ajout du nom de l'apprenant pour générer le certificat
          course_nom: quiz.courseId.nom, // Nom du cours pour générer le certificat
          date_obtention: certificat.date_obtention,
        },
      });
    } else {
      return res.status(200).json({
        message: "Désolé, vous avez échoué. Essayez encore.",
        score,
      });
    }
  } catch (error) {
    console.error("Erreur lors du passage du quiz :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


// Fonction pour télécharger le certificat
exports.telechargerCertificat = async (req, res) => {
  try {
    const { certificatId } = req.params;

    // Récupérer le certificat
    const certificat = await Certificat.findById(certificatId);
    if (!certificat) {
      return res.status(404).json({ message: "Certificat non trouvé." });
    }

    // Chemin vers le fichier PDF du certificat
    const pdfPath = path.join(
      __dirname,
      `../Public/certificats/certificat_${certificat._id}.pdf`
    );

    // Vérifier si le fichier existe
    if (!fs.existsSync(pdfPath)) {
      return res
        .status(404)
        .json({ message: "Le fichier du certificat n'existe pas." });
    }

    // Envoyer le fichier PDF pour téléchargement
    res.download(pdfPath);
  } catch (error) {
    console.error("Erreur lors du téléchargement du certificat :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

