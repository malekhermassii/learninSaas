const mongoose = require("mongoose");
const { Course } = require("../modeles/CourseModal"); 
const FeedbackSchema = new mongoose.Schema({
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  dateEnvoi: { type: Date, default: Date.now },
  apprenant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Apprenant' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
 
});
//middleware
FeedbackSchema.post('save', async function(doc, next) {
  try {
    // Update the feedback list
    await Course.findByIdAndUpdate(doc.courseId, {
      $push: { feedback_id: doc._id },
    });

    // Recalculate the course ratings
    const ratings = await mongoose.model("Feedback").aggregate([
      { $match: { courseId: doc.courseId } },
      {
        $group: {
          _id: "$courseId",
          totalRatingSum: { $sum: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
      {
        $project: {
          averageRating: {
            $round: [{ $divide: ["$totalRatingSum", "$totalRatings"] }, 1],
          },
          totalRatings: 1,
        },
      },
    ]);

    if (ratings.length > 0) {
      const { averageRating, totalRatings } = ratings[0];
      await Course.findByIdAndUpdate(doc.courseId, {
        averageRating,
        totalRatings,
      });
    }

    next();
  } catch (error) {
    console.error("Error updating course with feedback and ratings:", error);
    next(error);
  }
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
