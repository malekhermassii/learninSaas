const mongoose = require("mongoose");

const CoursSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  apprenantEnroll: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant' }] ,// Liste des étudiants inscrits
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
  enrolledCount :{type:Number,default: 0},
  level:{ type: String},
  languages:{ type: String}
});
//enrollschema
const EnrollmentSchema = new mongoose.Schema({
    apprenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    dateEnroll: { type: Date, default: Date.now }
});

//moduleschema
const ModuleSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  nbrVideo: { type:Number },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
});
//vdschema
const VideoSchema = new mongoose.Schema({
  titrevd: { type: String },
  duree: { type: String },
  url: [{ type: String }],
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
});
//progressionschema
const ProgressionSchema = new mongoose.Schema({
  apprenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Apprenant" },  // Référence à l'apprenant
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },      // Référence au cours
  lastUpdate: { type: Date, default: Date.now },                          // Date de dernière mise à jour
  modules: [
    {
      moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
      videosCompletees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
      progressionModule: { type: Number, default: 0 },
    },
  ],
  progressionCours: { type: Number, default: 0 },
  complet: { type: Boolean, default: false }  // Cours complété ou non
});
// Création des modèles
const Course = mongoose.model("Course", CoursSchema);
const Module = mongoose.model("Module", ModuleSchema);
const Video = mongoose.model("Video", VideoSchema);
const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);
const Progression = mongoose.model('Progression', ProgressionSchema);


// Export des deux modèles
module.exports = {
  Course,
  Module,
  Video,
  Enrollment,
  Progression
};