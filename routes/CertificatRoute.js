module.exports = (app)=>{
    const certificat = require("../controllers/CertificatController")
   // app.post("/certificat" , certificat.createCertificat)
    app.get("/certificat" , certificat.findAllCertificat)
    app.get("/certificat/:certificatId" , certificat.findOnecertificat)
    //app.put("/certificat/:certificatId" , certificat.updatecertificat)
    //app.delete("/certificat/:certificatId" , certificat.deletecertificat)
}
