const uploads = require("../uploads");
module.exports = (app)=>{
    const apprenant = require("../controllers/ApprenantController")
    const authMiddleware = require('../middleware/authMiddleware');
     // Protected routes
    //app.post("/apprenant" , apprenant.createapprenant)
    app.get("/apprenant" ,authMiddleware, apprenant.findAllApprenant)
    app.get("/apprenant/:apprenantId" ,authMiddleware, apprenant.findOneApprenant)
   // app.put("/apprenant/:apprenantId" ,uploads.fields([{ name: "image"}]), apprenant.updateApprenant)
    app.delete("/apprenant/:apprenantId" ,authMiddleware, apprenant.deleteApprenant)
    
}
