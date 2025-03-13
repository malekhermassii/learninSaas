const Question = require("../modeles/QuestionModal");
const { Course, Video } = require("../modeles/CourseModal");
exports.createQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    // Création de la question
    const qst = new Question({
      question: req.body.question,
      apprenant_id: req.apprenant_id, //recuper middlware auth
      courseId: courseId,
    });

    // Sauvegarde de la question
    const savedQuestion = await qst.save();

    // M
    // Mise à jour du cours avec le nouveau question
    await Course.findByIdAndUpdate(courseId, {
      $push: { question_id: savedQuestion._id },
    });

    // Réponse réussie
    res.status(201).send({
      message: "Question créée avec succès et ajoutée au cours",
      question: savedQuestion,
    });
  } catch (error) {
    res.status(500).send({
      message:
        error.message || "Erreur serveur lors de la création de la question",
    });
  }
};

exports.findAllquestion = (req, res) => {
  Question.find()
    .populate("apprenant_id", "nom")
    .populate("courseId", "nom")
    .then((questions) => {
      res.send(questions);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our question",
      });
    });
};

//getone
exports.findOnequestion = (req, res) => {
  Question.findById(req.params.questionId)
    .populate("apprenant_id", "nom")
    .populate("courseId", "nom")
    .then((question) => {
      if (!question) {
        return res.status(404).send({
          message: "question not found by id " + req.params.questionId,
        });
      }
      res.send(question);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the question by id" +
            req.params.questionId,
      });
    });
};

// L'administrateur répond à une question
exports.repondreQuestion = async (req, res) => {
  try {
    const { questionId } = req.params; // Récupération de l'ID de la question
    const { reponse } = req.body; // Récupération de la réponse envoyée par l'admin

    // Vérifier si la réponse est fournie
    if (!reponse) {
      return res
        .status(400)
        .json({ message: "La réponse ne peut pas être vide." });
    }

    // Vérifier si la question existe
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question non trouvée." });
    }

    // Mise à jour de la question avec la réponse de l'admin
    question.reponse = reponse;
    await question.save();

    res
      .status(200)
      .json({ message: "Réponse enregistrée avec succès", question });
  } catch (error) {
    console.error("Erreur lors de la réponse à la question :", error);
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la réponse à la question",
        error: error.message,
      });
  }
};
