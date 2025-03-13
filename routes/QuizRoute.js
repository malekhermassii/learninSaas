
module.exports = (app)=>{
    const quizes = require("../controllers/QuizController")
    app.post("/quiz" , quizes.createQuiz)
    app.get("/quiz" , quizes.findAllQuizs)
    app.get("/quiz/:quizId" , quizes.findOneQuiz)
    app.put("/quiz/:quizId" , quizes.updateQuiz)
    app.delete("/quiz/:quizId" , quizes.deletequiz)
    app.post("/passerQuiz/:quizId" , quizes.passerQuiz)
    app.get("/api/certificats/:certificatId/telecharger", quizes.telechargerCertificat);
}
