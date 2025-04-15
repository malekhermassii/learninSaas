const uploads = require("../uploads");
module.exports = (app)=>{
    const courses = require("../controllers/CoursController")
     // Protected routes
    const authMiddleware = require('../middleware/authMiddleware');
    app.post("/course" , uploads.fields([{ name: "image"}, { name: "url"}]) ,authMiddleware, courses.createCourse)
    app.get("/course" , courses.findAllCourses)
    app.get("/course/search", courses.search);
    app.get("/course/:courseId" , courses.findOneCourse)
    app.put("/course/:courseId" ,uploads.fields([{ name: "image"}, { name: "url"}]),authMiddleware, courses.updateCourse)
    app.delete("/course/:courseId" , courses.deleteCourse)
    app.put("/course/:courseId/accepter",authMiddleware, courses.approveCourse);
    app.put("/course/:courseId/refuser",authMiddleware, courses.refuseCourse);
    app.post('/enroll/:courseId',authMiddleware, courses.enroll);
    app.put("/progress/update/:courseId/:moduleId/:videoId/:apprenantId" ,authMiddleware,courses.updateProgress);
    app.get("/courseprogress",authMiddleware,courses.getProgression);

  
}
