const uploads = require("../uploads");
module.exports = (app)=>{
    const demandes = require("../controllers/DemandeController")
    app.post("/demandes" ,uploads.fields([{name : "cv"}]), demandes.createdemande),
    app.put("/demandes/:demandeId/accepter", demandes.accepterdemande);
    app.put("/demandes/:demandeId/refuser", demandes.refusedemande);
    app.get("/demandes" , demandes.findAlldemandes)
    app.get("/demandes/:demandeId" , demandes.findOneuser)
    app.delete("/demandes/:demandeId" , demandes.deletedemande)
}
