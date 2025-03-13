const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    nom: {
      type: String,
      required: true, // Le nom est requis
    },
    email: {
      type: String,
      required: true,
      unique: true, // L'email doit être unique
      lowercase: true, // L'email sera converti en minuscules
    },
    motDePasse: {
      type: String,
      required: true, // Le mot de passe est requis
    },
    
    createdAt: {
      type: Date,
      default: Date.now, // La date de création de l'utilisateur
    },
  });
module.exports = mongoose.model("User" , UserSchema)