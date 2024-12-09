const mongoose = require("mongoose");

const bankApplicationDeclinedSchema = mongoose.Schema(
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
    bankDeclined: {
      type: Boolean,
      default: false,
    },
    bankDeclinedOn: {
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
  "ApplicationDeclined",
  bankApplicationDeclinedSchema
);
