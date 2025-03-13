const uploads = require("../uploads");
module.exports = (app)=>{
    const categorie = require("../controllers/CategorieController")
    app.post("/categorie" ,uploads.fields([{ name: "image"}]), categorie.createCategorie)
    app.get("/categorie" , categorie.findAllCategorie)
    app.get("/categorie/:categorieId" , categorie.findOneCategorie)
    app.put("/categorie/:categorieId" ,uploads.fields([{ name: "image"}]) , categorie.updateCategorie)
    app.delete("/categorie/:categorieId" , categorie.deleteCategorie)
}
