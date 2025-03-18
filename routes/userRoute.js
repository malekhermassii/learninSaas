const uploads = require("../uploads");
module.exports = (app) => {
  const users = require("../controllers/userController");
  const authMiddleware = require("../middleware/authMiddleware");

  app.post("/register", users.register);
  app.post("/login", users.login);
  app.get("/users", users.findAllusers);
  app.delete("/users/:userId", users.deleteuser);
  // Protected routes
  app.post("/logout", authMiddleware, users.logout);
  app.put("/profile", authMiddleware,uploads.fields([{ name: "image"}]), users.updateProfile);

 // app.get("/users/:userId", users.findOneuser);
 
};
