const mongoose = require("mongoose");

const CoursSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  nbAbonnes: { type: Number, default: 0 },
  image: { type: String },
  statut: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  averageRating: {type: Number,default: 0},
  totalRatings: {type: Number,default: 0},
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
  categorieId: { type: mongoose.Schema.Types.ObjectId, ref: "Categorie" },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  question_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  feedback_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Feedback' }],
  professeurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professeur' },
});

const ModuleSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  nbrVideo: { type:Number },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
});

const VideoSchema = new mongoose.Schema({
  titrevd: { type: String },
  duree: { type: String },
  url: [{ type: String }],
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
});

// Création des modèles
const Course = mongoose.model("Course", CoursSchema);
const Module = mongoose.model("Module", ModuleSchema);
const Video = mongoose.model("Video", VideoSchema);


// Export des deux modèles
module.exports = {
  Course,
  Module,
  Video
};