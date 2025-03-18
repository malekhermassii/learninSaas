const mongoose = require("mongoose");

const ApprenantSchema = new mongoose.Schema({
    userId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    certificat_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificat' }],
    abonnement_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Abonnement' },
    
});

module.exports = mongoose.model("Apprenant", ApprenantSchema);
