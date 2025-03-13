const mongoose = require("mongoose");

const ProfesseurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  motDePasse: { type: String, required: true },
  pays: { type: String },
  dateNaissance: { type: Date },
  telephone: { type: String },
  image: { type: String },
  specialite: { type: String, required: true },
  nbEtudiants: { type: Number, default: 0 },
  courseId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course'}],
  
});

module.exports = mongoose.model("Professeur", ProfesseurSchema);
