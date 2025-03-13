const uploads = require("../uploads");
module.exports = (app)=>{
    const professeur = require("../controllers/ProfesseurController")
    app.post("/professeur" ,uploads.fields([{ name: "image"}]), professeur.createProfesseur)
    app.get("/professeur" , professeur.findAllProfesseur)
    app.get("/professeur/:professeurId" , professeur.findOneprofesseur)
    app.put("/professeur/:professeurId" , uploads.fields([{ name: "image"}]), professeur.updateProfesseur)
    app.delete("/professeur/:professeurId" , professeur.deleteProfesseur)
}
