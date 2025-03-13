const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'user', 'moderator', 'editor'], // Exemples de rôles
    default: 'user'
  },
  permissions: {
    type: [String],
    required: true,
    enum: [
      'create', 
      'read', 
      'update', 
      'delete'
    ] // Exemples de permissions
  }});

module.exports = mongoose.model("Role", RoleSchema);
