const router = require("express").Router();
const {
  signup,
  activation,
  login,
  forgetPassword,
  resetPassword,
} = require("../controllers/userController");
// Image Upload
const { uploadPicture } = require("../utils/awsFunction");

// POST
// All Sign Up
router
  .route("/signup")
  .post(uploadPicture.fields([{ name: "bankLogo", maxCount: 1 }]), signup);

// POST
// Activate Operator
router.route("/activation").post(activation);

// POST
// All Login
router.route("/login").post(login);

// POST
// Forgot Password
router.route("/forgotPassword").post(forgetPassword);

// PUT
// Reset Password
router.route("/resetPassword/:token").put(resetPassword);

module.exports = router;
