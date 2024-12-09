const mongoose = require("mongoose");

const BankApplicationViewedSchema = mongoose.Schema(
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
    viewedApplication: {
      type: Boolean,
    },
    viewedApplicationOn: {
      // type: String,
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model(
  "ApplicationViewed",
  BankApplicationViewedSchema
);
