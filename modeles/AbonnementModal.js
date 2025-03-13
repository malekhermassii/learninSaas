const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nom du plan (ex: month, three months..)
  price: { type: Number, required: true }, // Prix du plan
  offers: { type: String}, // Fonctionnalités du plan
  duration : {type:String}
});

const AbonnementSchema = new mongoose.Schema({
  apprenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Apprenant" },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true }, // Référence au plan
  dateDebut: { type: Date, default: Date.now },
  dateFin: { type: Date },
  statut: { type: String, enum: ["actif", "expiré"], default: "actif" },
  stripeSubscriptionId: { type:String },
  payments: [{
    date:{ type: Date },
    amount: { type: Number },
    invoiceId: { type: String }
  }]
  
});

const paiementSchema = new mongoose.Schema({
  abonnement_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Abonnement', required: true },
  montant: { type: Number, required: true },
  methodePaiement: {type: String,required: true},
  stripePaymentIntentId: {type: String,required: true,unique: true },
  statut: { type: String, enum: ['réussi', 'échoué'],default: 'en_attente'}
}, { timestamps: true });



const Plan = mongoose.model("Plan", PlanSchema);
const Abonnement = mongoose.model("Abonnement", AbonnementSchema);
const Payment = mongoose.model('Paiement', paiementSchema);

module.exports = { Plan, Abonnement,Payment };
