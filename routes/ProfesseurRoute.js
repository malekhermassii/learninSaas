const uploads = require("../uploads");
module.exports = (app)=>{
    const professeur = require("../controllers/ProfesseurController");
    const authMiddleware = require('../middleware/authMiddleware');
    app.post("/professeurcreate" , professeur.registerProfessor);
    app.post("/professeurlogin", professeur.login);
    //protecetd route
    app.post("/logout", authMiddleware, professeur.logout);
    app.put("/updateprofile" , uploads.fields([{ name: "image"}]), authMiddleware, professeur.updateProfile)
    app.get("/professeur" ,authMiddleware, professeur.findAllProfesseur)
    app.get("/professeur/:professeurId" ,authMiddleware ,professeur.findOneprofesseur)
    app.delete("/professeur/:professeurId" ,authMiddleware, professeur.deleteProfesseur)
    app.put("/professeur/:professeurId" ,authMiddleware, professeur.updateProfesseur)

   
 
}
