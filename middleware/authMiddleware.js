// External Packages
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
// Models
const Operator = require("../models/operatorModel");
const Bank = require("../models/bankModel");
const adminModel = require("../models/adminModel");

exports.isAuthenticated = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // get token from header
      token = req.headers.authorization.split(" ")[1];

      // verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get Operator from token
      req.user = await Operator.findById(decoded.id);

      next();
    } catch (error) {
      // console.log(error,'Not authorized Error');
      res.status(401);
      throw new Error("Not authorized");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

exports.isBank = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // get token from header
      token = req.headers.authorization.split(" ")[1];

      // verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get Bank from Bank Model
      req.user = await Bank.findById(decoded.id);

      next();
    } catch (error) {
      // console.log(error,'Not authorized Error');
      res.status(401);
      throw new Error("Not authorized");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

exports.isAdmin = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // get token from header
      token = req.headers.authorization.split(" ")[1];

      // verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get Admin from Admin Model
      req.user = await adminModel.findById(decoded.id);

      next();
    } catch (error) {
      // console.log(error,'Not authorized Error');
      res.status(401);
      throw new Error("Not authorized");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});
