const mongoose = require("mongoose");

const bankApplicationAcceptedSchema = mongoose.Schema(
  {
    bank_ID: {
      type: mongoose.Schema.ObjectId,
      ref: "Bank",
    },
    application_Id: {
      type: String,
    },
    createdAt: {
      // type: String,
      type: Date,
    },
    // View Applications
    viewApplication: {
      type: mongoose.Schema.ObjectId,
      ref: "ApplicationViewed",
    },
    // Application Accept
    bankAccept: {
      type: Boolean,
      default: false,
    },
    bankAcceptedOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
    servicesOffered: {
      type: Array,
    },
    // After Proposal Sent
    proposalSent: {
      type: Boolean,
      default: false,
    },
    proposalSentOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
    // After Operator Accept Proposal
    proposalAccepted: {
      type: Boolean,
      default: false,
    },
    proposalAcceptedOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
    // Underwriting Process
    underwriting: {
      type: Boolean,
      default: false,
    },
    underwritingStartedOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
    underwritingProcess: {
      type: String,
      default: "Waiting",
    },
    documentUpload: {
      type: Boolean,
      default: false,
    },
    documents: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "OperatorDocument",
      },
    ],
    documentUploadOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
    // After Bank Mark "Account Open"
    accountOpened: {
      type: String,
      default: "Waiting",
    },
    activityEndedOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "ApplicationAccepted",
  bankApplicationAcceptedSchema
);
