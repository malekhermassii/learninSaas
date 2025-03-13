const mongoose = require("mongoose");

const DemandeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    country: { type: String, required: true },
    speciality: { type: String, required: true },
    cv: { type: String, required: true }, // URL du CV ou fichier encodé
    birthDate: { type: Date, required: true },
    topic: { type: String, required: true },
    statut: { type: String, default: 'pending' },
    dateEntretien: { type: Date },

});

module.exports = mongoose.model("Demande", DemandeSchema);
