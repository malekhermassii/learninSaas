const uploads = require("../uploads");
module.exports = (app)=>{
    const apprenant = require("../controllers/ApprenantController")
    app.post("/apprenant" ,uploads.fields([{ name: "image"}]), apprenant.createapprenant)
    app.get("/apprenant" , apprenant.findAllApprenant)
    app.get("/apprenant/:apprenantId" , apprenant.findOneApprenant)
    app.put("/apprenant/:apprenantId" ,uploads.fields([{ name: "image"}]), apprenant.updateApprenant)
    app.delete("/apprenant/:apprenantId" , apprenant.deleteApprenant)
}
