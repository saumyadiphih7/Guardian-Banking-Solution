const asyncHandler = require("express-async-handler");
const { format } = require("date-fns");
// Models
// Operator
const proposalRecievedModel = require("../models/proposalRecievedModel");
const proposalRejectedModel = require("../models/proposalRejectedModel");
// Bank
const bankModel = require("../models/bankModel");
const applicationAcceptedModel = require("../models/applicationAcceptedModel");
// Middleware / Utilites
const sendEmail = require("../utils/sendEmail");
// ENV
const { FRONTEND_URL } = process.env;

// ----------------------------------------------------------- Proposals -----------------------------------------------------------

// GET
// Proposal List
exports.getProposalList = asyncHandler(async (req, res) => {
  const operatorID = req.user.id;
  const { applicationID } = req.params;
  const { startDate, endDate } = req.query;
  // Date Filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.proposalSentOn = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    dateFilter.proposalSentOn = { $gte: new Date(startDate) };
  } else if (endDate) {
    dateFilter.proposalSentOn = { $lte: new Date(endDate) };
  }

  // Finding all applications of this operator
  const proposals = await proposalRecievedModel
    .find({
      $and: [
        { applicant_ID: operatorID },
        { application_Id: applicationID },
        dateFilter,
      ],
    })
    .sort({ _id: -1 });
  // if (proposals.length === 0) {
  //   res.status(404);
  //   throw new Error("No proposals found");
  // }

  res.status(200).json(proposals);
});

// GET
// Proposal Details
exports.getProposalDetails = asyncHandler(async (req, res) => {
  const { applicationID, proposalID } = req.params;
  const operatorID = req.user.id;

  const proposalDetails = await proposalRecievedModel.findOne({
    $and: [
      { applicant_ID: operatorID },
      { application_Id: applicationID },
      { proposalID: proposalID },
    ],
  });
  if (!proposalDetails) {
    res.status(404);
    throw new Error("No proposal found");
  }

  res.status(200).json(proposalDetails);
});

// ----------------------------------------------------------- Accept / Decline Proposal -----------------------------------------------------------

// GET
// Operator Proposal Accept Bank
exports.proposalAccept = asyncHandler(async (req, res) => {
  const operatorID = req.user.id;
  const { applicationID, proposalID } = req.params;
  // Finding the proposal in Operator Proposal Collection
  const proposalDetails = await proposalRecievedModel.findOne({
    $and: [
      { applicant_ID: operatorID },
      { application_Id: applicationID },
      { proposalID: proposalID },
    ],
  });
  if (!proposalDetails) {
    res.status(404);
    throw new Error("No proposal found");
  }
  // Proposal ID is Bank ID
  const bankID = proposalID;
  const bank = await bankModel.findById(bankID);
  if (!bank) {
    res.status(404);
    throw new Error("No bank found");
  }
  // Finding Accepted Application from the Bank in Accepted Application Collection
  const acceptedApplication = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: applicationID }],
  });
  if (!acceptedApplication) {
    res.status(404);
    throw new Error("No accepted Application found");
  }

  if (acceptedApplication.proposalAccepted === true) {
    res.status(200).json({
      message: `Bank Proposal has already been accepted by you, Please wait for Bank to response`,
    });
  }
  // else {
  // const newDate = new Date();
  // Formatting Date as US Format
  // const date = format(newDate, "MM-dd-yyyy");
  const newDate = new Date();
  const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";

  // Saving Proposal Accepted and the date in Bank Accepted Application Collection
  acceptedApplication.proposalAccepted = true;
  acceptedApplication.proposalAcceptedOn = date;
  await acceptedApplication.save();

  // Saving Proposal Accepted and the date in operator proposal Collection
  proposalDetails.proposalAccepted = true;
  proposalDetails.proposalAcceptedOn = date;
  await proposalDetails.save();

  const URL = `${FRONTEND_URL}/approve`;
  const html = `Hello ${bank.bankName},
    <br>
    You have received a Proposal Accepted mail from a Operator.
    <br>
    Click on the button to check out
    <br>
    <a href=${URL}> <button >Proposal Accepted Operator</button> </a>
    <br>`;

  res.status(200).json({
    message:
      "You have accepted this Bank... Wait for bank to get in contact with you for underwriting process",
  });
  // try {
  //   await sendEmail({
  //     email: bank.email,
  //     subject: "Operator Accepted",
  //     html,
  //   });
  //   res.status(200).json({
  //     message:
  //       "You have accepted this Bank... Wait for bank to get in contact with you for underwriting process",
  //   });
  // } catch (error) {
  //   res.status(401).json({ message: "Couldn't send a mail to bank" });
  // }
});

// GET
// Operator Proposal Decline Bank
exports.proposalDecline = asyncHandler(async (req, res) => {
  const operatorID = req.user.id;
  const { applicationID, proposalID } = req.params;
  // Finding the proposal in Operator Proposal Collection
  const proposalDetails = await proposalRecievedModel.findOne({
    $and: [
      { applicant_ID: operatorID },
      { application_Id: applicationID },
      { proposalID: proposalID },
    ],
  });
  if (!proposalDetails) {
    res.status(404);
    throw new Error("No proposal found");
  }
  // Proposal ID is Bank ID
  const bankID = proposalID;
  const bank = await bankModel.findById(bankID);
  if (!bank) {
    res.status(404);
    throw new Error("No bank found");
  }
  // Finding Accepted Application from the Bank in Accepted Application Collection
  const acceptedApplication = await applicationAcceptedModel.findOne({
    $and: [{ bank_ID: bankID }, { application_Id: applicationID }],
  });
  if (!acceptedApplication) {
    res.status(404);
    throw new Error("No accepted Application found");
  }
  // If already accepted then cannot decline
  if (acceptedApplication.proposalAccepted === true) {
    res.status(200).json({
      message: `Bank Proposal has already been accepted by you, You cannot decline it`,
    });
  } else {
    const newDate = new Date();
    const date = newDate.toISOString().split("T")[0] + "T00:00:00.000Z";
    // Create a rejected proposal in proposalrejected collection
    await proposalRejectedModel.create({
      applicant_ID: proposalDetails.applicant_ID,
      application_Id: proposalDetails.application_Id,
      application_dba: proposalDetails.application_dba,
      proposalID: proposalDetails.proposalID,
      servicesOffered: proposalDetails.servicesOffered,
      proposalSentOn: proposalDetails.proposalSentOn,
      proposalRejected: true,
      proposalRejectedOn: date,
      activityEndedOn: date,
    });

    // Remove both documents from both Collections
    await proposalRecievedModel.findByIdAndDelete(proposalDetails._id);
    await applicationAcceptedModel.findByIdAndDelete(acceptedApplication._id);
    // res.status(200).json({ message: `Proposal Declined Successfully` });

    // bank will recieve a mail about application id has declined your proposal
    const URL = `${FRONTEND_URL}/accepted-applications`;
    const html = `Hello ${bank.bankName},
  <br>
  You have received a mail from Application ID: ${applicationID},
  <br>
  As they have declined your proposal
  <br>
  Please go back to your Accepted Applications list as Application ID : ${applicationID} has been removed from the list
  <br>
  <a href=${URL}> <button>Accepted Applications</button> </a>
  <br>`;

    res.status(200).json({
      message: `Proposal Declined Successfully`,
    });
    // try {
    //   await sendEmail({
    //     email: bank.email,
    //     subject: "Declined Proposal",
    //     html,
    //   });
    //   res.status(200).json({
    //     message: `Proposal Declined Successfully`,
    //   });
    // } catch (error) {
    //   res.status(401).json({ message: "Couldn't send a mail to bank" });
    // }
  }
});

// ----------------------------------------------------------- Operator Viewing Bank Details -----------------------------------------------------------

// GET
// Opeator Viewing Bank Details After Bank Start their underwriting process
exports.bankDetails = asyncHandler(async (req, res) => {
  const operatorID = req.user.id;
  const { applicationID, proposalID } = req.params;
  // Finding the proposal in Operator Proposal Collection
  const proposalDetails = await proposalRecievedModel.findOne({
    $and: [
      { applicant_ID: operatorID },
      { application_Id: applicationID },
      { proposalID: proposalID },
    ],
  });
  if (!proposalDetails) {
    res.status(404);
    throw new Error("No proposal found");
  }

  if (proposalDetails.proposalAccepted == false) {
    res.status(401);
    throw new Error("Operator has not accpted bank's proposal yet");
  }
  if (proposalDetails.underwriting == false) {
    res.status(401);
    throw new Error(
      "Bank has not yet put your application in underwriting process.. Wait for bank to response"
    );
  }

  // Proposal ID is Bank ID
  const bankID = proposalID;
  // Bank Details
  const bank = await bankModel.findById(bankID);
  const {
    servicesOffered,
    password,
    access,
    formFilled,
    matchedApplicationPercentage,
    ...otherDetails
  } = bank._doc;

  const bankDetails = { ...otherDetails };
  const underwritingProcess = proposalDetails.underwritingProcess;
  res.status(200).json({ bankDetails, underwritingProcess });
});
