const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ProfesseurSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateNaissance: { type: Date },
  telephone: { type: String },
  image: { type: String },
  specialite: { type: String },
  courseId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course'}],
  
});
// Hash password before saving
ProfesseurSchema.pre('save', async function(next) {  // This is a Mongoose middleware that runs before saving a user to the database.
    if (!this.isModified('password')) return next();  // If the password hasn't been modified, move on to the next middleware or save process.
    const salt = await bcrypt.genSalt(10);  // Generate a salt with a complexity factor of  The salt is used to add randomness to the hash.
    this.password = await bcrypt.hash(this.password, salt);  // Hash the password using bcrypt with the generated salt.
    next();  // Proceed to the next step (save the user) after hashing the password.
  });

 // Compare password method
 ProfesseurSchema.methods.comparePassword = async function(candidatePassword) {  // This is an instance method added to the user schema to compare the candidate (entered) password with the stored hashed password.
     return await bcrypt.compare(candidatePassword, this.password);  // Use bcrypt.compare to compare the candidate password (entered by the user) with the stored password hash.
   };
   
  
module.exports = mongoose.model("Professeur", ProfesseurSchema);
