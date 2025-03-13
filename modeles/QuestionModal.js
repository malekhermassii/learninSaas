const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  reponse: { type: String },
  apprenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
 
});

module.exports = mongoose.model("Question", QuestionSchema);

