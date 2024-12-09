const express = require("express");
const router = express.Router();
// Controllers
const {
  operatorProfile,
  operatorProfileUpdate,
  operatorChangePassword,
  fillApplication,
  updateApplication,
  deleteApplication,
  applicationList,
  applicationDetails,
  dashboard,
  documentations,
  documentUpload,
} = require("../controllers/operatorController");
const {
  getProposalList,
  getProposalDetails,
  proposalAccept,
  proposalDecline,
  bankDetails,
} = require("../controllers/operatorProposalController");
// Authentication
const { isAuthenticated } = require("../middleware/authMiddleware");
// Utilities
const { uploadPicture, uploadFiles } = require("../utils/awsFunction");

// ----------------------------------------------------------- Profile -----------------------------------------------------------

// GET
// Operator Profile
router.route("/profile").get(isAuthenticated, operatorProfile);

// UPDATE
// Operator Profile
router
  .route("/profile/update")
  .put(
    uploadPicture.single("operatorLogo"),
    isAuthenticated,
    operatorProfileUpdate
  );

// UPDATE
// Operator Password
router.route("/profile/password").put(isAuthenticated, operatorChangePassword);

// ----------------------------------------------------------- Applications -----------------------------------------------------------

// POST
// Application Fill
router.route("/form").post(isAuthenticated, fillApplication);

// UPDATE
// Application Update
router
  .route("/form/update/:applicationID")
  .put(isAuthenticated, updateApplication);

// DELETE
// Application Delete
router
  .route("/form/delete/:applicationID")
  .delete(isAuthenticated, deleteApplication);

// GET
// Applications List
router.route("/formList").get(isAuthenticated, applicationList);

// GET
// Application Details
router
  .route("/Oneoperatorform/:applicationID")
  .get(isAuthenticated, applicationDetails);

// ----------------------------------------------------------- Dashboard -----------------------------------------------------------

// GET
// Dashboard
router.route("/dashboard").get(isAuthenticated, dashboard);

// ----------------------------------------------------------- Documents -----------------------------------------------------------

// GET
// Document
router.route("/document").get(isAuthenticated, documentations);

// POST
// Upload Documents
router
  .route("/document/upload")
  .post(uploadFiles.single("document"), isAuthenticated, documentUpload);

// ----------------------------------------------------------- Proposals -----------------------------------------------------------

// GET
// Proposal List
router.route("/proposal/:applicationID").get(isAuthenticated, getProposalList);

// GET
// Proposal Details
router
  .route("/proposal/:applicationID/:proposalID")
  .get(isAuthenticated, getProposalDetails);

// ----------------------------------------------------------- Operator Viewing Bank Details -----------------------------------------------------------

// GET
// Opeator Viewing Bank Details After Operator Accepted Proposal
router
  .route("/proposal/bankDetails/:applicationID/:proposalID")
  .get(isAuthenticated, bankDetails);

// ----------------------------------------------------------- Accept / Decline Proposal -----------------------------------------------------------

// GET
// Accept Bank
router
  .route("/proposal/accept/:applicationID/:proposalID")
  .get(isAuthenticated, proposalAccept);

// GET
// Decline Bank
router
  .route("/proposal/decline/:applicationID/:proposalID")
  .get(isAuthenticated, proposalDecline);

module.exports = router;
