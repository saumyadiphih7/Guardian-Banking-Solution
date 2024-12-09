const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { format } = require("date-fns");
// Models
const Operator = require("../models/operatorModel");
const bankModel = require("../models/bankModel");
// Middleware / Utilites
const { sendToken } = require("../utils/sendToken");
const sendEmail = require("../utils/sendEmail");
const { sendActivationEmail } = require("../utils/sendGrid");
// ENV
const { FRONTEND_URL, JWT_SECRET } = process.env;

// POST
// All Sign Up
exports.signup = asyncHandler(async (req, res) => {
  const { role } = req.query;
  if (!role) {
    res.status(400);
    throw new Error("Please mention your role");
  }

  // ---------------------------------------------- Bank ----------------------------------------------

  if (role === "bank") {
    const { bankName, email, password, bankContactNumber } = req.body;
    if (!(bankName && email && password && bankContactNumber)) {
      res.status(400);
      throw new Error("Please fill all fields");
    }

    const bankExists = await bankModel.findOne({
      $or: [{ email }, { bankContactNumber }],
    });
    if (bankExists) {
      res.status(400);
      throw new Error("Bank Already Exists");
    }

    const date = new Date();
    // Formatting Date as US Format
    const formattedDate = format(date, "MM-dd-yyyy");

    const bank = await bankModel.create({
      bankName,
      email,
      password,
      bankContactNumber,
      createdAt: formattedDate,
    });

    const { password: pass, ...data } = bank._doc;

    if (bank) {
      sendToken(res, role, data, "Bank Register Successfully", 201);
    } else {
      res.status(400);
      throw new Error("Invalid Bank data");
    }
  }

  // ---------------------------------------------- Operator ----------------------------------------------

  if (role === "operator") {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      //  address,
      //  industryType
    } = req.body;
    const operatorExists = await Operator.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (operatorExists) {
      res.status(400);
      throw new Error("Operator Already Exists");
    }

    const user = {
      fullName,
      email,
      password,
      phoneNumber,
      // address,
      // industryType,
    };

    const activationToken = createActivationToken(user);
    const activationUrl = `${FRONTEND_URL}/activation/${activationToken}`;
    const html = `Hello ${user.fullName},
<br>
Please click on the link to activate your account
<br>
<a href=${activationUrl}> <button >Click Here</button> </a>
<br>
This will expire within 15 minutes`;

    const data = {
      email: email,
      activationURL: activationUrl,
    };

    await sendActivationEmail(data);
    res.status(200).json({
      role,
      message: `Please check your email:- ${user.email} to activate your account`,
    });
  }
});

// Function
// Create Activation Token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

// POST
// Activate through Email
exports.activation = asyncHandler(async (req, res) => {
  const role = "operator";
  try {
    const { activation_token } = req.body;
    const user = jwt.verify(activation_token, JWT_SECRET);
    if (!user) {
      res.status(400);
      throw new Error(
        "Activation Token is invalid or has been expired... Try Again"
      );
    }

    const { fullName, email, password, phoneNumber } = user;

    const operatorExists = await Operator.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (operatorExists) {
      res.status(400);
      throw new Error("Operator Already Exists");
    }

    const date = new Date();
    // Formatting Date as US Format
    const formattedDate = format(date, "MM-dd-yyyy");

    const operator = await Operator.create({
      fullName,
      email,
      password,
      phoneNumber,
      createdAt: formattedDate,
    });

    const { password: pass, ...data } = operator._doc;

    if (operator) {
      sendToken(
        res,
        role,
        data,
        "Email has been verified and Account activated Successfully",
        200
      );
    } else {
      res.status(400);
      throw new Error("Invalid Operator data");
    }
  } catch (error) {
    res.status(500);
    throw new Error("Invalid Operator data");
  }
});

// POST
// All Login
exports.login = asyncHandler(async (req, res) => {
  const { role } = req.query;
  if (!role) {
    res.status(400);
    throw new Error("Please mention your role");
  }

  // ---------------------------------------------- Bank ----------------------------------------------

  if (role === "bank") {
    const { email, bankContactNumber, password } = req.body;
    if ((!email && !bankContactNumber) || !password) {
      res.status(400);
      throw new Error("Please Enter Your Credentials");
    }

    // Checking Bank
    const bank = await bankModel.findOne({
      $or: [
        { email: email },
        { bankContactNumber: email },
        { email: bankContactNumber },
        { bankContactNumber: bankContactNumber },
      ],
    });
    if (!bank) {
      res.status(401);
      throw new Error("Invalid Email and Password");
    }
    const { password: pass, ...data } = bank._doc;
    // Check Password
    const checkPassword = await bank.comparePassword(password);
    if (!checkPassword) {
      res.status(401);
      throw new Error("Invalid Email and Password");
    }

    if (checkPassword) {
      sendToken(res, role, data, "Bank Logged In Successfully", 200);
    } else {
      res.status(400);
      throw new Error("Invalid Email");
    }
  }

  // ---------------------------------------------- Operator ----------------------------------------------

  if (role === "operator") {
    const { email, phoneNumber, password } = req.body;
    if ((!email && !phoneNumber) || !password) {
      res.status(400);
      throw new Error("Please Enter Your Credentials");
    }

    const operator = await Operator.findOne({
      $or: [
        { email: email },
        { phoneNumber: email },
        { email: phoneNumber },
        { phoneNumber: phoneNumber },
      ],
    });
    if (!operator) {
      res.status(401);
      throw new Error("Invalid Email and Password");
    }

    const { password: pass, ...data } = operator._doc;

    // Check Password
    const checkPassword = await operator.comparePassword(password);
    if (!checkPassword) {
      res.status(401);
      throw new Error("Invalid Email and Password");
    }

    if (checkPassword) {
      sendToken(res, role, data, "Operator Logged In Successfully", 200);
    } else {
      res.status(400);
      throw new Error("Invalid Email");
    }
  }

  // ---------------------------------------------- Admin as USERS ----------------------------------------------

  if (role === "admin") {
    const { email, role } = req.body;
    if (!email || !role) {
      res.status(400);
      throw new Error("Please Enter the Credentials");
    }

    // ----------------------- Bank -----------------------

    if (role === "bank") {
      // Checking Bank
      const bank = await bankModel.findOne({
        email: email,
      });

      const { password: pass, ...data } = bank._doc;

      if (bank) {
        sendToken(res, role, data, "Bank Logged In Successfully", 200);
      } else {
        res.status(400);
        throw new Error("Invalid Email");
      }
    }

    // ----------------------- Operator -----------------------

    if (role === "operator") {
      // Checking operator
      const operator = await Operator.findOne({
        email: email,
      });

      const { password: pass, ...data } = operator._doc;

      if (operator) {
        sendToken(res, role, data, "Operator Logged In Successfully", 200);
      } else {
        res.status(400);
        throw new Error("Invalid Email");
      }
    }
  }
});

// POST
// Forgot Password
exports.forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { role } = req.query;
  if (!role) {
    res.status(400);
    throw new Error("Please mention your role");
  }

  // ---------------------------------------------- Bank ----------------------------------------------

  if (role === "bank") {
    const bank = await bankModel.findOne({ email: email });
    if (!bank) {
      res.status(401);
      throw new Error("Invalid Email");
    }

    const resetToken = await bank.getResetToken();
    await bank.save();

    const resetURL = `${FRONTEND_URL}/resetpassword/bank/${resetToken}`;
    const html = `Hello ${bank.fullName},
<br>
Click on the link to reset your password.
<br>
<a href=${resetURL}> <button >Click Here</button> </a>
<br>
This will expire within 15 minutes`;

    // Send token via email
    await sendEmail({
      email: bank.email,
      subject: "GBS Reset Password",
      html,
    });

    res.status(200).json({
      message: `Reset Token has been sent to ${bank.email}`,
    });
  }

  // ---------------------------------------------- Operator ----------------------------------------------

  if (role === "operator") {
    const operator = await Operator.findOne({ email: email });
    if (!operator) {
      res.status(401);
      throw new Error("Invalid Email");
    }

    const resetToken = await operator.getResetToken();
    await operator.save();

    const resetURL = `${FRONTEND_URL}/resetpassword/operator/${resetToken}`;
    const html = `Hello ${operator.fullName},
<br>
Click on the link to reset your password.
<br>
<a href=${resetURL}> <button >Click Here</button> </a>
<br>
This will expire within 15 minutes`;

    // Send token via email
    await sendEmail({
      email: operator.email,
      subject: "GBS Reset Password",
      html,
    });

    res.status(200).json({
      message: `Reset Token has been sent to ${operator.email}`,
    });
  }
});

// PUT
// Reset Password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { role } = req.query;
  if (!role) {
    res.status(400);
    throw new Error("Please mention your role");
  }

  const { password } = req.body;
  if (!password) {
    res.status(400);
    throw new Error("Please Enter your Password");
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // ---------------------------------------------- Bank ----------------------------------------------

  if (role === "bank") {
    const bank = await bankModel.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!bank) {
      res.status(401);
      throw new Error(
        "Reset Token is invalid or has been expired... Try Again"
      );
    }

    bank.password = password;
    bank.resetPasswordExpire = undefined;
    bank.resetPasswordToken = undefined;

    await bank.save();

    res.status(200).json({
      message: `Password Changed Successfully`,
    });
  }

  // ---------------------------------------------- Operator ----------------------------------------------

  if (role === "operator") {
    const operator = await Operator.findOne({
      resetPasswordToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!operator) {
      res.status(401);
      throw new Error(
        "Reset Token is invalid or has been expired... Try Again"
      );
    }

    operator.password = password;
    operator.resetPasswordExpire = undefined;
    operator.resetPasswordToken = undefined;

    await operator.save();

    res.status(200).json({
      message: `Password Changed Successfully`,
    });
  }
});
