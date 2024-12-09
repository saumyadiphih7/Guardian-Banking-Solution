const express = require("express");
const router = express.Router();
// Controllers
const {
  bankProfile,
  bankProfileUpdate,
  bankChangePassword,
  bankfillSettings,
  bankUpdateSettings,
  bankSettingsDetails,
  getServicesOffered,
  dashboard,
} = require("../controllers/bankController");
const {
  viewedApplication,
  viewApplication,
  acceptedApplicationList,
  acceptApplication,
  declineApplication,
  declinedApplicationList,
  proposalSend,
  proposalDetails,
  underwritingProcess,
  accountOpen,
  accountDecline,
} = require("../controllers/bankApplicationController");
const {
  matchingApplications,
  matchApplicationsDetails,
} = require("../controllers/matchControllers");
// Authentication
const { isBank } = require("../middleware/authMiddleware");
// Utilities
const { uploadPicture } = require("../utils/awsFunction");

// ----------------------------------------------------------- Profile -----------------------------------------------------------

// GET
// Bank Profile
router.route("/profile").get(isBank, bankProfile);

// UPDATE
// Bank Profile
router
  .route("/profile/update")
  .put(uploadPicture.single("bankLogo"), isBank, bankProfileUpdate);

// UPDATE
// Bank Password
router.route("/profile/password").put(isBank, bankChangePassword);

// ----------------------------------------------------------- Bank Settings -----------------------------------------------------------

// POST
// Settings Fill up
router.route("/settings/fillup").post(isBank, bankfillSettings);

// UPDATE
// Settings
router.route("/settings/update").put(isBank, bankUpdateSettings);

// GET
// Settings Details
router.route("/settings/Details").get(isBank, bankSettingsDetails);

// ----------------------------------------------------------- Dashboard -----------------------------------------------------------

// GET
// Dashboard
router.route("/dashboard").get(isBank, dashboard);

// ----------------------------------------------------------- Services Offered -----------------------------------------------------------

// GET
// Bank Services Offered
router.route("/servicesOffered").get(isBank, getServicesOffered);

// ----------------------------------------------------------- Matching Applications -----------------------------------------------------------

// GET
// Match bank Settings with operator Application
router.route("/matchingApplications").get(isBank, matchingApplications);

// GET (Bank can see Operator Applications Details)
// Matched Operator Application Details
router
  .route("/matchingApplications/details/:id")
  .get(isBank, matchApplicationsDetails);

// ----------------------------------------------------------- View Applications -----------------------------------------------------------

// GET
// Viewed Applications
router.route("/viewedApplications").get(isBank, viewedApplication);

// POST
// View Applications
router.route("/viewApplication").post(isBank, viewApplication);

// ----------------------------------------------------------- Accept Applications -----------------------------------------------------------

// GET
// Accepted Applications
router.route("/acceptedApplications").get(isBank, acceptedApplicationList);

// POST
// Accept Applications
router.route("/acceptApplication").post(isBank, acceptApplication);

// POST
// Accept Applications
router.route("/declineApplication").post(isBank, declineApplication);

// GET
// Accepted Applications
router.route("/declinedApplications").get(isBank, declinedApplicationList);

// ----------------------------------------------------------- Proposal -----------------------------------------------------------

// POST
// Bank Proposal Send to Operator
router.route("/sendproposal/:id").post(isBank, proposalSend);

// Get
// Bank Proposal Details Sent to Operator
router.route("/getSentProposal/:id").get(isBank, proposalDetails);

// ----------------------------------------------------------- Underwritin gProcess -----------------------------------------------------------

// POST
// Bank Putting accplication in underwriting Process
router.route("/underwriting/:id").post(isBank, underwritingProcess);

// ----------------------------------------------------------- Account Open -----------------------------------------------------------

// Get
// Get Bank Open Account for Operator
router.route("/account/open/:id").get(isBank, accountOpen);

// Get
// Bank Decline Open Account for Operator
router.route("/account/decline/:id").get(isBank, accountDecline);

module.exports = router;
