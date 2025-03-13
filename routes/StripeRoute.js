
module.exports = (app)=>{
    const courses = require("../controllers/CoursController")
    app.post("/course" , uploads.fields([{ name: "image"}, { name: "url"}]) , courses.createCourse)
    app.get("/course" , courses.findAllCourses)
   
}
