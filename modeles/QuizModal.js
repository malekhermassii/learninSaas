const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Cours associé
  questionQuiz_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionQuiz" }], // Questions associées
  resultats: [
    {
      apprenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Apprenant" }, // Apprenant qui a passé le quiz
      score: { type: Number, default: 0 } // Score obtenu
    }
  ]
});

const QuestionQuizSchema = new mongoose.Schema({
  reponseCorrecte: { type: String},
  options: [{ type: String }],
  question: { type: String },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" } // Liaison avec quiz
    
});

// Création des modèles
const Quiz = mongoose.model("Quiz", QuizSchema);
const QuestionQuiz = mongoose.model("QuestionQuiz", QuestionQuizSchema);

// Export des deux modèles
module.exports = {
  Quiz,
  QuestionQuiz
};