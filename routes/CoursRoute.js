
const uploads = require("../uploads");
module.exports = (app)=>{
    const courses = require("../controllers/CoursController")
    app.post("/course" , uploads.fields([{ name: "image"}, { name: "url"}]) , courses.createCourse)
    app.get("/course" , courses.findAllCourses)
    app.get("/course/search", courses.search);
    app.get("/course/:courseId" , courses.findOneCourse)
    app.put("/course/:courseId" ,uploads.fields([{ name: "image"}, { name: "url"}]), courses.updateCourse)
    app.delete("/course/:courseId" , courses.deleteCourse)
    //app.get("/course/:courseId/rating", courses.getCoursesRatings);
    app.put("/course/:courseId/accepter", courses.approveCourse);
    app.put("/course/:courseId/refuser", courses.refuseCourse);
 
}
