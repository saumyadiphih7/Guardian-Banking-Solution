const mongoose = require("mongoose");

const operatorDocumentSchema = mongoose.Schema(
  {
    applicant_ID: {
      type: mongoose.Schema.ObjectId,
      ref: "Operator",
    },
    name: {
      type: String,
    },
    document: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("operatorDocument", operatorDocumentSchema);
