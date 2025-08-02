const dotenv = require("dotenv");
const express = require("express");
const sql = require("mssql");
const path = require("path");
dotenv.config();
const jwt = require("jsonwebtoken");
// const { upload, handleUpload } = require("./utils/fileUpload.js");

// // Controllers
const userController = require("./controllers/userController.js"); //test
// const friendController = require("./controllers/friendController.js");
// const matchController = require("./controllers/matchController.js");
// const chatController = require("./controllers/chatController.js");

// const medicationController = require("./controllers/medicationController.js");
// const appointmentController = require("./controllers/appointmentController.js");
// const caregiverController = require("./controllers/caregiverController.js");
// const emergencyContactsController = require("./controllers/emergencyContactController.js");
// const healthMetricsController = require("./controllers/healthMetricsController.js");

// const eventsController = require("./controllers/eventsController.js");
// const announcementsController = require("./controllers/announcementsController.js");
// const meetingsController = require("./controllers/meetingsController.js");

// const facilitiesController = require("./controllers/facilitiesController.js");
// const { initializeDatabase } = require("./utils/initializeDatabase.js");
// const bookmarkController = require("./controllers/bookmarkController.js");
// const reviewController = require("./controllers/reviewController.js");
// const navigationController = require("./controllers/navigationController.js");
// const reportController = require("./controllers/reportController.js");

// const exerciseController = require("./controllers/exerciseController.js");
// const goalController = require("./controllers/goalController.js");
// const weatherController = require("./controllers/weatherController.js");

// // Swagger setup
// const swaggerJsdoc = require("swagger-jsdoc");
// const swaggerUi = require("swagger-ui-express");
// const swaggerFile = require("./swagger-output.json");

// // Middlewares
// const {
//   validateCreateGroup,
//   validateGroupId,
// } = require("./middlewares/eventsValidation.js");
// const {
//   validateCreateAnnouncement,
//   validatePostComment,
//   validateDeleteComment,
//   validateEditAnnouncement,
// } = require("./middlewares/announcementsValidation.js");

const {
  validateRegisterUser
} = require("./middlewares/userValidation"); //test
// const {
//   protectSpecificRoutes,
//   redirectIfAuthenticated,
// } = require("./middlewares/protectRoute");

// const validateMatchProfile = require("./middlewares/validateMatchProfile.js");
// const validateGoal = require("./middlewares/goalValidation.js");
// const {
//   validateLocationAccess,
//   validateNearbyFacilities,
//   validateFacilityId,
//   validateFacilityType,
// } = require("./middlewares/facilitiesValidation.js");
// const {
//   validateBookmarkId,
//   validateBookmarkData,
//   validateFacilityIdParam,
// } = require("./middlewares/bookmarkValidation.js");
// const {
//   validateReviewIdParam,
//   validateReviewData,
//   validateUpdateReviewData,
// } = require("./middlewares/reviewValidation.js");
// const { validateReportData } = require("./middlewares/reportValidation.js");

// const { validateMessage } = require("./middlewares/chatValidation.js");


// Initialize the database connection
const app = express();
const port = process.env.PORT || 3000;

// Database connection configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.post("/api/register", validateRegisterUser, (res,req) => {
    userController.registerUser
}) //test