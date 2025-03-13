const mongoose = require("mongoose");

const CategorieSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  image: { type: String }
});

module.exports = mongoose.model("Categorie", CategorieSchema);
