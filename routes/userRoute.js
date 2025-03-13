module.exports = (app)=>{
    const users = require("../controllers/userController")
    app.post("/users" , users.createuser)
    app.get("/users" , users.findAllusers)
    app.get("/users/:userId" , users.findOneuser)
    app.put("/users/:userId" , users.updateUser)
    app.delete("/users/:userId" , users.deleteUser)
}
