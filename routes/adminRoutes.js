const router = require("express").Router();
// Admin Controller
const {
  adminSignUp,
  adminLogin,
  adminProfile,
  adminProfileUpdate,
  adminChangePassword,
  adminForgetPassword,
  adminResetPassword,
  // About Bank
  getAllBanks,
  paymentStage,
  bankDetailsUpdate,
  reports,
  // About Operator
  getAllOperators,
  nonUSCitizen,
} = require("../controllers/adminController");
// Authentication
const { isAdmin } = require("../middleware/authMiddleware");

// ------------------------------------------------------------ Login Sign Up ------------------------------------------------------------
// POST
// Admin Sign Up
router.route("/signup").post(adminSignUp);

// POST
// Admin Login
router.route("/login").post(adminLogin);

// ------------------------------------------------------------ Profile ------------------------------------------------------------
// GET
// Admin Profile
router.route("/profile").get(isAdmin, adminProfile);

// UPDATE
// Admin Profile Update
router.route("/profile/update").put(isAdmin, adminProfileUpdate);

// ------------------------------------------------------------ Password ------------------------------------------------------------

// UPDATE
// Admin Password Change
router.route("/profile/password").put(isAdmin, adminChangePassword);

// POST
// Admin Password Forgot
router.route("/forgotPassword").post(adminForgetPassword);

// PUT
// Admin Password Reset
router.route("/resetPassword/:token").put(adminResetPassword);

// ------------------------------------------------------------ About Bank ------------------------------------------------------------

// GET
// All Banks
router.route("/banks").get(isAdmin, getAllBanks);

// GET
// All Banks
router.route("/banks/reports").get(isAdmin, reports);

// PUT
// Payment Stage for Bank
router.route("/banks/paymentStage/:id").put(isAdmin, paymentStage);

// PUT
// Details Update
router.route("/banks/activate/:id").put(isAdmin, bankDetailsUpdate);

// ------------------------------------------------------------ About Operator ------------------------------------------------------------

// GET
// All Operators
router.route("/operators").get(isAdmin, getAllOperators);

router.route("/application/nonUS").get(isAdmin, nonUSCitizen);

module.exports = router;
