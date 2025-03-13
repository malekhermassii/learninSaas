const mongoose = require("mongoose");

const ApprenantSchema = new mongoose.Schema({
    certificat_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificat' }],
    abonnement_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Abonnement' },
});

module.exports = mongoose.model("Apprenant", ApprenantSchema);
