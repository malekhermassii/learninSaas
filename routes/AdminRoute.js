const uploads = require("../uploads");
module.exports = (app)=>{
    const authController = require('../controllers/AdminController');
    const authMiddleware = require('../middleware/authMiddleware');

    app.post('/adminregister', authController.register);
    app.post('/adminlogin', authController.login);
    // Protected routes
    app.post('/adminlogout', authMiddleware, authController.logout);
    app.put('/adminprofile', authMiddleware,uploads.fields([{ name: "image"}]), authController.updateAdminProfile);
}