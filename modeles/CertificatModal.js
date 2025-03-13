const mongoose = require("mongoose");

const CertificatSchema = new mongoose.Schema({
 
  apprenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Apprenant", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  date_obtention: { type: Date, default: Date.now },


});

module.exports = mongoose.model("Certificat", CertificatSchema);
