const asyncHandler = require("express-async-handler");
const { format } = require("date-fns");
// Models
// Bank
const applicationViewedModel = require("../models/applicationViewedModel");
const applicationAcceptedModel = require("../models/applicationAcceptedModel");
const applicationDeclinedModel = require("../models/applicationDeclinedModel");
// Operator
const operatorModel = require("../models/operatorModel");
const operatorApplicationModel = require("../models/operatorApplicationModel");
const proposalRecievedModel = require("../models/proposalRecievedModel");
// Middleware / Utilites
const sendEmail = require("../utils/sendEmail");
// ENV
const { FRONTEND_URL } = process.env;

// ----------------------------------------------------------- Viewed Applications -----------------------------------------------------------

// GET
// Viewed Applications
exports.viewedApplication = asyncHandler(async (req, res) => {
  const bankID = req.user.id;

  const numViewedApplications = await applicationViewedModel.countDocuments({
    $and: [{ bank_ID: bankID }, { viewedApplication: true }],
  });

  const applications = await applicationViewedModel.find({
    $and: [{ bank_ID: bankID }, { viewedApplication: true }],
  });

  const viewedApplications = applications.map(
    (application) => application.application_Id
  );

  res.status(200).json({ numViewedApplications, viewedApplications });
});

// POST
// Viewed Applications
exports.viewApplication = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const { id } = req.body;

  const application = await operatorApplicationModel.findOne({
    application_Id: id,
  });
  if (!application) {
    res.status(404);
    throw new Error("No application found");
  }

  const applicationViewed = await applicationViewedModel.findOne({
    $and: [
      { bank_ID: bankID },
      { application_Id: id },
      { viewedApplication: true },
    ],
  });
  if (applicationViewed) {
    res.status(200).json({
      message: `You have already viewed application ${id}... You can go through`,
    });
  } else {
    // const newDate = new Date();
    // Formatting Date as US Format
    // const date = format(newDate, "MM-dd-yyyy");
    const newDate = new Date();
    const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

    const viewedApplication = await applicationViewedModel.create({
      bank_ID: bankID,
      application_Id: id,
      createdAt: application.createdAt,
      viewedApplication: true,
      viewedApplicationOn: date,
    });

    res.status(200).json({
      message: `You are viewing application ${id} for the very 1st time`,
      viewedApplication,
    });
  }
});

// ----------------------------------------------------------- Accept Applications -----------------------------------------------------------

// GET
// Accept Operator Appliction
exports.acceptedApplicationList = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const { startDate, endDate, state } = req.query;
  // Date Filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.bankAcceptedOn = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    dateFilter.bankAcceptedOn = { $gte: new Date(startDate) };
  } else if (endDate) {
    dateFilter.bankAcceptedOn = { $lte: new Date(endDate) };
  }
  // State Filter
  let statusFilter = {};
  // In Progress -> Meaning Bank has sent a proposal but operators yet to accept the proposal
  if (state === "inprogress") {
    statusFilter = {
      proposalSent: true,
      proposalAccepted: false,
    };
  }
  // Open -> Meaning Bank has opened an account for the operator
  else if (state === "open") {
    statusFilter = {
      accountOpened: "Account Opened",
    };
  }
  // Decline -> Meaning Bank has declined to open an account for the operator
  else if (state === "decline") {
    statusFilter = {
      accountOpened: "Account Declined",
    };
  }

  const acceptedApplications = await applicationAcceptedModel
    .find({
      $and: [
        { bank_ID: bankID },
        { bankAccept: true },
        dateFilter,
        statusFilter,
      ],
    })
    .sort({ _id: -1 });
  // if (acceptedApplications.length === 0) {
  //   res.status(404);
  //   throw new Error("No Accepted Applications Found");
  // }

  const resultApplications = acceptedApplications.map((application) => ({
    ...application.toObject(),
    proposalSentOn: "Waiting",
    proposalAcceptedOn: "Waiting",
    underwritingStartedOn: "Waiting",
    activityEndedOn: "Waiting",
  }));

  res.status(200).json(resultApplications);
});

// POST
// Accept Application
exports.acceptApplication = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const { id } = req.body;

  const application = await operatorApplicationModel.findOne({
    application_Id: id,
  });
  if (!application) {
    res.status(404);
    throw new Error("No application found");
  }

  const viewedApplication = await applicationViewedModel.findOne({
    $and: [
      { bank_ID: bankID },
      { application_Id: id },
      { viewedApplication: true },
    ],
  });
  if (!viewedApplication) {
    res.status(400);
    throw new Error(
      "You haven't viewed this application yet... Please view it propoerly"
    );
  }

  const alreadyAccepted = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }, { bankAccept: true }],
  });
  if (alreadyAccepted) {
    res.status(200).json({
      message: `Application ID ${id} has already been accepted, Please go to Accepted Applications`,
    });
  } else {
    // const newDate = new Date();
    // Formatting Date as US Format
    // const date = format(newDate, "MM-dd-yyyy");
    const newDate = new Date();
    const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

    await applicationAcceptedModel.create({
      bank_ID: bankID,
      application_Id: application.application_Id,
      createdAt: application.createdAt,
      viewApplication: viewedApplication._id,
      bankAccept: true,
      bankAcceptedOn: date,
    });

    res.status(200).json({ message: `Application ID ${id} has been accepted` });
  }
});

// POST
// Declined Application
exports.declineApplication = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const { id } = req.body;

  const application = await operatorApplicationModel.findOne({
    application_Id: id,
  });
  if (!application) {
    res.status(404);
    throw new Error("No application found");
  }

  const viewedApplication = await applicationViewedModel.findOne({
    $and: [
      { bank_ID: bankID },
      { application_Id: id },
      { viewedApplication: true },
    ],
  });
  if (!viewedApplication) {
    res.status(400);
    throw new Error(
      "You haven't viewed this application yet... Please view it propoerly"
    );
  }

  const alreadyAccepted = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }, { bankAccept: true }],
  });
  const alreadyDeclined = await applicationDeclinedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }, { bankDeclined: true }],
  });

  if (alreadyAccepted) {
    res.status(200).json({
      message: `Application ID ${id} has already been accepted, Please go to Accepted Applications`,
    });
  } else if (alreadyDeclined) {
    res.status(200).json({
      message: `Application ID ${id} has already been declined, Cannot decline again`,
    });
  } else {
    // const newDate = new Date();
    // Formatting Date as US Format
    // const date = format(newDate, "MM-dd-yyyy");
    const newDate = new Date();
    const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

    await applicationDeclinedModel.create({
      bank_ID: bankID,
      application_Id: application.application_Id,
      createdAt: application.createdAt,
      viewApplication: viewedApplication._id,
      bankDeclined: true,
      bankDeclinedOn: date,
    });

    res.status(200).json({ message: `Application ID ${id} has been declined` });
  }
});

// GET
// Accept Operator Appliction
exports.declinedApplicationList = asyncHandler(async (req, res) => {
  const bankID = req.user.id;
  const { startDate, endDate } = req.query;
  // Date Filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.bankDeclinedOn = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    dateFilter.bankDeclinedOn = { $gte: new Date(startDate) };
  } else if (endDate) {
    dateFilter.bankDeclinedOn = { $lte: new Date(endDate) };
  }

  const declinedApplication = await applicationDeclinedModel
    .find({
      $and: [{ bank_ID: bankID }, { bankDeclined: true }, dateFilter],
    })
    .sort({ _id: -1 });
  // if (declinedApplication.length === 0) {
  //   res.status(404);
  //   throw new Error("No declined Applications Found");
  // }

  res.status(200).json(declinedApplication);
});

// ----------------------------------------------------------- Proposal -----------------------------------------------------------

// POST
// Bank Proposal Send
exports.proposalSend = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { servicesOffered } = req.body;

  const bankID = req.user.id;
  // Finding the bank in applicationAcceptedModel Model
  const acceptedApplication = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }],
  });
  if (!acceptedApplication) {
    res.status(404);
    throw new Error("No accepted Application found");
  }
  // Checking if the bank has already sent a proposal
  if (acceptedApplication.proposalSent == true) {
    res.status(404);
    throw new Error("Proposal already Sent");
  }

  // Finding the operator application of the application ID
  const operatorApplication = await operatorApplicationModel.findOne({
    application_Id: id,
  });
  if (!operatorApplication) {
    res.status(404);
    throw new Error("No Operator application Found");
  }
  // Finding the operator of that operator application
  const applicantId = operatorApplication.applicant_ID;
  const operator = await operatorModel.findById(applicantId);
  if (!operator) {
    res.status(404);
    throw new Error("No Operator Found");
  }

  // const newDate = new Date();
  // Formatting Date as US Format
  // const date = format(newDate, "MM-dd-yyyy");
  const newDate = new Date();
  const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

  const Legal_Business_Name = operatorApplication.Legal_Business.name;
  const Legal_Business_DBA = operatorApplication.Legal_Business.dba;

  await proposalRecievedModel.create({
    applicant_ID: applicantId,
    application_Id: id,
    application_dba:
      Legal_Business_DBA == "" ? Legal_Business_Name : Legal_Business_DBA,
    proposalID: bankID, // Operator's Proposal ID is the BankID
    servicesOffered: servicesOffered,
    proposalSentOn: date,
    proposalAccepted: false,
    // proposalAcceptedOn: "Waiting",
    underwriting: false,
    underwritingProcess: "Waiting",
    accountOpened: "Waiting",
  });
  // Bank accepted application -> saving proposal sent & services Offered lists
  acceptedApplication.proposalSent = true;
  acceptedApplication.proposalSentOn = date;
  acceptedApplication.servicesOffered.push(servicesOffered);
  // Saving bank accepted application's services offered
  await acceptedApplication.save();

  const proposalID = bankID;
  const URL = `${FRONTEND_URL}/proposals-received/${id}/${proposalID}`;
  const html = `Hello ${operator.fullName},
  <br>
  You have received a proposal mail from a Bank.
  <br>
  Click on the button to check out
  <br>
  <a href=${URL}> <button >Proposal</button> </a>
  <br>`;

  res.status(200).json({
    message: `Email send to Operator successfully`,
  });

  // try {
  //   await sendEmail({
  //     email: operator.email,
  //     subject: "Bank Proposal",
  //     html,
  //   });
  //   res.status(200).json({
  //     message: `Email send to Operator successfully`,
  //   });
  // } catch (error) {
  //   res.status(401).json(error);
  // }
});

// GET
// Bank Proposal Details Sent to Operator
exports.proposalDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bankID = req.user.id;
  const acceptedApplication = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }],
  });

  if (!acceptedApplication) {
    // res.status(200).json([]);
    res.status(200).json("No application found");
  } else if (acceptedApplication.proposalSent == false) {
    // res.status(200).json([]);
    res.status(200).json("No proposal Send");
  } else {
    const servicesOffered = acceptedApplication.servicesOffered[0];
    res.status(200).json(servicesOffered);
  }
});

// ----------------------------------------------------------- Underwriting Process -----------------------------------------------------------

// POST
// Bank Putting accplication in underwriting Process
exports.underwritingProcess = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { underwritingProcess } = req.body;
  const bankID = req.user.id;
  const acceptedApplication = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }],
  });
  if (!acceptedApplication) {
    res.status(404);
    throw new Error("No accepted Application found");
  }
  // Checking if the bank has already sent a proposal
  if (acceptedApplication.proposalSent == false) {
    res.status(404);
    throw new Error("You haven't yet send a Proposal");
  }
  // Checking if the Operator has accepted the proposal
  if (acceptedApplication.proposalAccepted == false) {
    res.status(404);
    throw new Error("Operator hasn't yet accepted your proposal");
  }
  // Checking if the underwriting process has started
  if (acceptedApplication.underwriting == true) {
    res.status(404);
    throw new Error("Underwriting process has already started");
  }
  if (acceptedApplication.accountOpened == "Account Opened") {
    res.status(404);
    throw new Error("You have already open an account for this application");
  }

  // const newDate = new Date();
  // Formatting Date as US Format
  // const date = format(newDate, "MM-dd-yyyy");
  const newDate = new Date();
  const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

  // Bank will Mark underwriting has as -> true
  acceptedApplication.underwriting = true;
  acceptedApplication.underwritingStartedOn = date;
  acceptedApplication.underwritingProcess = underwritingProcess;
  await acceptedApplication.save();

  // Finding Operator of this Application
  const operatorApplication = await operatorApplicationModel.findOne({
    application_Id: id,
  });
  if (!operatorApplication) {
    res.status(404);
    throw new Error("No Application Found");
  }
  // Finding Proposal in operator proposal collection
  const operatorProposal = await proposalRecievedModel.findOne({
    $and: [{ application_Id: id }, { proposalID: bankID }],
  });
  // And the proposal account open should be true
  operatorProposal.underwriting = true;
  operatorProposal.underwritingStartedOn = date;
  operatorProposal.underwritingProcess = underwritingProcess;
  await operatorProposal.save();

  // Finding Operator of this Application
  const applicantId = operatorApplication.applicant_ID;
  const operator = await operatorModel.findById(applicantId);
  if (!operator) {
    res.status(404);
    throw new Error("No Operator Found");
  }

  const html = `Hello ${operator.fullName},
<br>
Congratulations.
<br>
Your Application ${id} has been started for underwriting process.
<br>
Now you can see the bank details also
<br>`;

  res.status(200).json({
    message: `Underwriting Process for ${id} has been started`,
  });

  // try {
  //   await sendEmail({
  //     email: operator.email,
  //     subject: "Underwriting Process",
  //     html,
  //   });
  //   res.status(200).json({
  //     message: `Underwriting Process for ${id} has been started`,
  //   });
  // } catch (error) {
  //   res.status(401).json(error);
  // }
});

// ----------------------------------------------------------- Account Open / Decline -----------------------------------------------------------

// GET
// Bank Account Open for Operator
exports.accountOpen = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bankID = req.user.id;
  // Finding the bank in applicationAcceptedModel Model
  const acceptedApplication = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }],
  });
  if (!acceptedApplication) {
    res.status(404);
    throw new Error("No accepted Application found");
  }
  // Checking if the bank has already sent a proposal
  if (acceptedApplication.proposalSent == false) {
    res.status(404);
    throw new Error("You haven't yet send a Proposal");
  }
  // Checking if the Operator has accepted the proposal
  if (acceptedApplication.proposalAccepted == false) {
    res.status(404);
    throw new Error("Operator hasn't yet accepted your proposal");
  }
  if (acceptedApplication.underwriting == false) {
    res.status(404);
    throw new Error("Bank have not yet finished underwriting process");
  }
  if (acceptedApplication.accountOpened == "Account Opened") {
    res.status(404);
    throw new Error("You have already open an account for this application");
  }
  // Bank will Open the account for Operator
  acceptedApplication.accountOpened = "Account Opened";

  // Finding Operator of this Application
  const operatorApplication = await operatorApplicationModel.findOne({
    application_Id: id,
  });
  if (!operatorApplication) {
    res.status(404);
    throw new Error("No Application Found");
  }

  // const newDate = new Date();
  // Formatting Date as US Format
  // const date = format(newDate, "MM-dd-yyyy");
  const newDate = new Date();
  const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

  // Operator Appllication account open Should be true
  operatorApplication.accountOpened = true;
  operatorApplication.activityEndedOn = date;
  // Finding Proposal in operator proposal collection
  const operatorProposal = await proposalRecievedModel.findOne({
    $and: [{ application_Id: id }, { proposalID: bankID }],
  });
  // And the proposal account open should be true
  operatorProposal.accountOpened = "Account Opened";
  operatorProposal.activityEndedOn = date;
  // After changes... Both will be saved
  await acceptedApplication.save();
  await operatorProposal.save();
  await operatorApplication.save();

  // Finding Operator of this Application
  const applicantId = operatorApplication.applicant_ID;
  const operator = await operatorModel.findById(applicantId);
  if (!operator) {
    res.status(404);
    throw new Error("No Operator Found");
  }

  const html = `Hello ${operator.fullName},
<br>
Congratulations.
<br>
Your Application ${id} has been accepted by a bank and an account has been opened 
<br>`;

  res.status(200).json({
    message: `Bank has opened an account for ${id}`,
  });
  // try {
  //   await sendEmail({
  //     email: operator.email,
  //     subject: "Account Open",
  //     html,
  //   });
  //   res.status(200).json({
  //     message: `Bank has opened an account for ${id}`,
  //   });
  // } catch (error) {
  //   res.status(401).json(error);
  // }
});

// GET
// Bank Decline Open Account for Operator
exports.accountDecline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bankID = req.user.id;
  // Finding the bank in applicationAcceptedModel Model
  const acceptedApplication = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: id }],
  });
  if (!acceptedApplication) {
    res.status(404);
    throw new Error("No accepted Application found");
  }
  // Checking if the bank has already sent a proposal
  if (acceptedApplication.proposalSent == false) {
    res.status(404);
    throw new Error("You haven't yet send a Proposal");
  }
  // Checking if the Operator has accepted the proposal
  if (acceptedApplication.proposalAccepted == false) {
    res.status(404);
    throw new Error("Operator hasn't yet accepted your proposal");
  }
  if (acceptedApplication.underwriting == false) {
    res.status(404);
    throw new Error("Bank have not yet finished underwriting process");
  }
  if (acceptedApplication.accountOpened == "Account Opened") {
    res.status(404);
    throw new Error("You have already open an account for this application");
  }

  // const newDate = new Date();
  // Formatting Date as US Format
  // const date = format(newDate, "MM-dd-yyyy");
  const newDate = new Date();
  const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

  // Account Should be Declined
  acceptedApplication.accountOpened = "Account Declined";
  acceptedApplication.activityEndedOn = date;

  // Finding Operator of this Application
  const operatorApplication = await operatorApplicationModel.findOne({
    application_Id: id,
  });
  if (!operatorApplication) {
    res.status(404);
    throw new Error("No Application Found");
  }

  // Turning Operator Application to match with other banks again
  operatorApplication.approved = false;
  // Finding Proposal in operator proposal collection
  const operatorProposal = await proposalRecievedModel.findOne({
    $and: [{ application_Id: id }, { proposalID: bankID }],
  });
  // And the proposal account open should be Declined
  operatorProposal.accountOpened = "Account Declined";
  operatorProposal.activityEndedOn = date;
  // All Changes Should be saved
  await acceptedApplication.save();
  await operatorProposal.save();
  await operatorApplication.save();

  // FInding Operator of this Application
  const applicantId = operatorApplication.applicant_ID;
  const operator = await operatorModel.findById(applicantId);
  if (!operator) {
    res.status(404);
    throw new Error("No Operator Found");
  }

  const proposalID = bankID;
  const URL = `${FRONTEND_URL}/proposals-received/${id}/${proposalID}`;
  const html = `Hello ${operator.fullName},
 <br>
 We are Sorry.
 <br>
 Your Application ID: ${id} has been declined by a bank of Proposal ID : ${proposalID}
 <br>`;

  res.status(200).json({
    message: `Declined to open an account for ${id} of Proposal ID : ${proposalID}`,
  });

  // try {
  //   await sendEmail({
  //     email: operator.email,
  //     subject: "Account Declined",
  //     html,
  //   });
  //   res.status(200).json({
  //     message: `Declined to open an account for ${id} of Proposal ID : ${proposalID}`,
  //   });
  // } catch (error) {
  //   res.status(401).json(error);
  // }
});
