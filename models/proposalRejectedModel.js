const mongoose = require("mongoose");

const ProposalRejectedSchema = mongoose.Schema(
  {
    applicant_ID: {
      type: mongoose.Schema.ObjectId,
      ref: "Operator",
    },
    application_Id: {
      type: String,
    },
    application_dba: {
      type: String,
    },
    proposalID: {
      type: String,
    },
    servicesOffered: {
      type: Array,
    },
    proposalSentOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
    proposalRejected: {
      type: Boolean,
      default: false,
    },
    proposalRejectedOn: {
      // type: String,
      // default: "Waiting",
      type: Date,
    },
    // // Underwriting Process
    // underwriting: {
    //   type: Boolean,
    //   default: false,
    // },
    // underwritingStartedOn: {
    //   // type: String,
    //   // default: "Waiting",
    //   type: Date,
    // },
    // underwritingProcess: {
    //   type: String,
    //   default: "Waiting",
    // },
    // accountOpened: {
    //   type: String,
    //   default: "Waiting",
    // },
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

module.exports = mongoose.model("ProposalRejected", ProposalRejectedSchema);
