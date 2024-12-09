const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const crypto = require("crypto");

const bankSchema = mongoose.Schema(
  {
    bankName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please Enter Valid Email"],
    },
    password: {
      type: String,
    },
    bankContactNumber: {
      type: String,
    },
    bankState: {
      type: String,
      default: "",
    },
    bankCity: {
      type: String,
      default: "",
    },
    bankZip: {
      type: String,
      default: "",
    },
    bankAddress: {
      type: String,
      default: "",
    },
    bankType: {
      type: String,
      default: "",
    },
    bankLogo: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    website: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    formFilled: {
      type: Boolean,
      default: false,
    },
    access: {
      type: Boolean,
      default: false,
    },
    matchedApplicationStatus: {
      type: Boolean,
      default: false,
    },
    matchedApplicationPercentage: {
      type: Number,
      default: 0,
    },
    paymentStage: {
      stage: {
        type: String,
        default: "View",
      },
      price: {
        type: Number,
        default: 400,
      },
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: String,
    },
    // createdAt: {
    //   type: String,
    // },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash Password
bankSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Match Password
bankSchema.method("comparePassword", async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
});

// Reset Password Token
bankSchema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("Bank", bankSchema);
