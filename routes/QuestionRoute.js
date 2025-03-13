module.exports = (app)=>{
    const questions = require("../controllers/QuestionController")
    app.post("/question/:courseId" , questions.createQuestion)
    app.get("/question" , questions.findAllquestion)
    app.get("/question/:questionId" , questions.findOnequestion)
    app.put("/question/:questionId/reponse" , questions.repondreQuestion)
   
}
