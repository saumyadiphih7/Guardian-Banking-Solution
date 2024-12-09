const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
// Model
// Admin
const adminModel = require("../models/adminModel");
// Operator
const operatorModel = require("../models/operatorModel");
const operatorApplicationModel = require("../models/operatorApplicationModel");
const proposalRecievedModel = require("../models/proposalRecievedModel");
// Bank
const bankModel = require("../models/bankModel");
const applicationViewedModel = require("../models/applicationViewedModel");
const applicationAcceptedModel = require("../models/applicationAcceptedModel");
// Middleware / Utilites
const { sendToken } = require("../utils/sendToken");
const sendEmail = require("../utils/sendEmail");

// ----------------------------------------------------------- Login Sign Up -----------------------------------------------------------

// POST
// Admin Sign Up
exports.adminSignUp = asyncHandler(async (req, res) => {
  const { email, password, adminName } = req.body;
  // console.log(req.body);

  if (!(email && password && adminName)) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  const adminExists = await adminModel.findOne({ email });
  if (adminExists) {
    res.status(400);
    throw new Error("admin name Already Exists");
  }

  const { password: pass, ...data } = adminExists._doc;

  const admin = await adminModel.create({
    email,
    password,
    adminName,
    role: "admin",
  });
  if (admin) {
    sendToken(res, { role: "admin" }, data, "admin Register Successfully", 201);
  } else {
    res.status(400);
    throw new Error("Invalid admin data");
  }
});

// POST
// All Login
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please Enter admin Credentials");
  }

  // Checking admin
  const admin = await adminModel.findOne({ email });
  if (!admin) {
    res.status(401);
    throw new Error("Invalid admin Credential");
  }

  const { password: pass, ...data } = admin._doc;

  // Check Password
  const checkPassword = await admin.comparePassword(password);
  if (!checkPassword) {
    res.status(401);
    throw new Error("Invalid admin Credential");
  }

  if ((admin, checkPassword)) {
    sendToken(
      res,
      { role: "admin" },
      data,
      "admin Logged In Successfully",
      200
    );
  } else {
    res.status(400);
    throw new Error("Invalid admin Credential");
  }
});

// ----------------------------------------------------------- Profile -----------------------------------------------------------

// GET
// Admin Profile
exports.adminProfile = asyncHandler(async (req, res) => {
  const admin = await adminModel.findById(req.user.id).select("-password");
  if (!admin) {
    res.status(404);
    throw new Error("No admin Found");
  }
  res.status(200).json(admin);
});

// UPDATE
// Admin Profile
exports.adminProfileUpdate = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const admin = await adminModel.findById(id);
  if (!admin) {
    res.status(404);
    throw new Error("No admin Found");
  }

  const updatedProfile = await adminModel.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  res.status(200).json({ message: "Profile Updated", updatedProfile });
});

// ----------------------------------------------------------- Password -----------------------------------------------------------

// UPDATE
// Password
exports.adminChangePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Please enter all the fields");
  }

  const admin = await adminModel.findById(req.user.id).select("+password");

  const isMatch = await admin.comparePassword(oldPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Incorrect Old Password");
  }

  admin.password = newPassword;``
  await admin.save();

  res.status(200).json({
    message: `${admin.adminName}, Your Password Changed Successfully`,
  });
});

// POST
// Forgot Password
exports.adminForgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const admin = await adminModel.findOne({ email: email });
  if (!admin) {
    res.status(401);
    throw new Error("Invalid Email");
  }

  const resetToken = await admin.getResetToken();
  await admin.save();

  const resetURL = `${FRONTEND_URL}/resetpassword/${resetToken}`;
  //     const message = `Hello ${admin.fullName},
  // Click on the link to reset your password.
  // ${resetURL}
  // This will expire within 15 minutes`;
  const html = `Hello ${admin.fullName},
<br>
Click on the link to reset your password.
<br>
<a href=${resetURL}> <button >Click Here</button> </a>
<br>
This will expire within 15 minutes`;

  // Send token via email
  await sendEmail({
    email: admin.email,
    subject: "GBS Reset Password",
    // message,
    html,
  });

  res.status(200).json({
    message: `Reset Token has been sent to ${admin.email}`,
  });
});

// PUT
// Reset Password
exports.adminResetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) {
    res.status(400);
    throw new Error("Please Enter your Password");
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const admin = await adminModel.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!admin) {
    res.status(401);
    throw new Error("Reset Token is invalid or has been expired... Try Again");
  }

  admin.password = password;
  admin.resetPasswordExpire = undefined;
  admin.resetPasswordToken = undefined;

  await admin.save();

  res.status(200).json({
    message: `Password Changed Successfully`,
  });
});

// ----------------------------------------------------------- About Bank -----------------------------------------------------------

// GET
// All Bank
exports.getAllBanks = asyncHandler(async (req, res) => {
  const banks = await bankModel.find().lean().select("-password");
  if (!banks || banks.length === 0) {
    res.status(404);
    throw new Error("No Banks Found");
  }

  const bankDetailsPromises = banks.map(async (bank) => {
    const { _id, bankName, matchedApplicationStatus, paymentStage, createdAt } =
      bank;

    // View Applications
    const numViewedApplications = await applicationViewedModel.countDocuments({
      $and: [{ bank_ID: _id }, { viewedApplication: true }],
    });
    // Accepted Applications
    const numAcceptedApplications =
      await applicationAcceptedModel.countDocuments({
        $and: [{ bank_ID: _id }, { bankAccept: true }],
      });
    // Number of applications in Underwriting
    const numUnderwriting = await applicationAcceptedModel.countDocuments({
      $and: [{ bank_ID: _id }, { underwriting: true }],
    });
    // Number of accounts open
    const numAccountOpen = await applicationAcceptedModel.countDocuments({
      $and: [{ bank_ID: _id }, { accountOpened: "Account Opened" }],
    });
    // Number of accounts decline
    const numAccountDecline = await applicationAcceptedModel.countDocuments({
      $and: [{ bank_ID: _id }, { accountOpened: "Account Declined" }],
    });

    return {
      _id,
      bankName,
      matchedApplicationStatus,
      paymentStage,
      createdAt,
      numViewedApplications,
      numAcceptedApplications,
      numUnderwriting,
      numAccountOpen,
      numAccountDecline,
    };
  });

  const bankDetails = await Promise.all(bankDetailsPromises);

  res.status(200).json(bankDetails);
});

// PUT
// Payment Stage for Bank
exports.paymentStage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bank = await bankModel.findById(id);
  if (!bank) {
    res.status(404);
    throw new Error("No Banks Found");
  }

  const { stage, price } = req.body;

  bank.paymentStage.stage =
    stage === " " || !stage ? bank.paymentStage.stage : stage;
  bank.paymentStage.price =
    price === " " || !price ? bank.paymentStage.price : price;
  await bank.save();

  res.status(200).json({
    message: `Payment stage updated for ${bank.bankName}`,
    paymentStage: bank.paymentStage,
  });
});

// PUT
// Update Bank Details
exports.bankDetailsUpdate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bank = await bankModel.findById(id);
  if (!bank) {
    res.status(404);
    throw new Error("No Banks Found");
  }

  const updatedDetails = await bankModel
    .findByIdAndUpdate(id, req.body, {
      new: true,
    })
    .select("-password");

  res.status(200).json({
    message: ` ${bank.bankName} Details updated successfully`,
    updatedDetails,
  });
});

// GET
// Reports
exports.reports = asyncHandler(async (req, res) => {
  const bankReports = await Promise.all([
    applicationViewedModel
      .find()
      .lean()
      .populate("bank_ID", "bankName paymentStage"),
    applicationAcceptedModel
      .find()
      .lean()
      .populate("bank_ID", "bankName paymentStage")
      .populate("viewApplication", "viewedApplicationOn")
      .select("-servicesOffered"),
  ]);
  // Using Flat -> because Promise.all here is returning array of array
  const allReports = bankReports.flat().map((report) => ({
    bankName: report.bank_ID.bankName,
    application_Id: report.application_Id,
    date:
      report.viewedApplicationOn ||
      report.bankAcceptedOn ||
      report.proposalAcceptedOn ||
      report.documentUploadOn ||
      report.activityEndedOn,
    stage: report.bank_ID.paymentStage.stage,
    price: report.bank_ID.paymentStage.price,
  }));

  const { startDate, endDate } = req.query;
  function filterReports(allReports, startDate, endDate) {
    if (!startDate || !endDate) {
      return allReports;
    }
    // Convert startDate and endDate strings to Date objects
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    // Filter reports based on the date range
    return allReports.filter((report) => {
      const reportDate = new Date(report.date);
      return reportDate >= startDate && reportDate <= endDate;
    });
  }

  const reports = filterReports(allReports, startDate, endDate);

  res.status(200).json(reports);
});

// ----------------------------------------------------------- About Operator -----------------------------------------------------------

// GET
// All Operator
exports.getAllOperators = asyncHandler(async (req, res) => {
  const operators = await operatorModel.find().lean().select("-password");
  if (!operators || operators.length === 0) {
    res.status(404);
    throw new Error("No Operators Found");
  }
  const operatorDetailsPromise = operators.map(async (operator) => {
    const { _id, fullName, email, phoneNumber, createdAt } = operator;

    //  Number of Application filled
    const applicationCount = await operatorApplicationModel.countDocuments({
      applicant_ID: _id,
    });
    // Number of proposals received
    const numProposalReceived = await proposalRecievedModel.countDocuments({
      applicant_ID: _id,
    });
    // Number of proposals accepted
    const numProposalAccepted = await proposalRecievedModel.countDocuments({
      $and: [{ applicant_ID: _id }, { proposalAccepted: true }],
    });

    return {
      _id,
      fullName,
      email,
      phoneNumber,
      createdAt,
      applicationCount,
      numProposalReceived,
      numProposalAccepted,
    };
  });

  const operatorDetails = await Promise.all(operatorDetailsPromise);

  res.status(200).json(operatorDetails);
});

// GET
// View Non US Citizens
exports.nonUSCitizen = asyncHandler(async (req, res) => {
  const applications = await operatorApplicationModel.find({
    "Primary_Information.us_Citizenship": "no",
  });
  if (!applications) {
    res.status(404);
    throw new Error("There is no non us citizen's application");
  }

  const numApplications = await operatorApplicationModel.countDocuments({
    "Primary_Information.us_Citizenship": "no",
  });

  res.status(200).json({ count: numApplications, data: applications });
});
