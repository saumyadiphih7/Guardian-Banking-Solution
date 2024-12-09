const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const crypto = require("crypto");

const operatorSchema = mongoose.Schema(
  {
    fullName: {
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
    phoneNumber: {
      type: String,
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    zip: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      default: "",
    },
    operatorLogo: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    companyWebsite: {
      type: String,
      default: "",
    },
    access: {
      type: Boolean,
      default: false,
    },
    formFilled: {
      type: Boolean,
      default: false,
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
operatorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Match Password
operatorSchema.method("comparePassword", async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
});

// Reset Password Token
operatorSchema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("Operator", operatorSchema);
