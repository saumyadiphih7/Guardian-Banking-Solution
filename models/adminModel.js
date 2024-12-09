const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const crypto = require("crypto");

const adminSchema = mongoose.Schema(
  {
    adminName: {
      type: String,
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please Enter Valid Email"],
    },
    password: {
      type: String,
    },
    role: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash Password
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Match Password
adminSchema.method("comparePassword", async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
});

// Reset Password Token
adminSchema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("admin", adminSchema);
