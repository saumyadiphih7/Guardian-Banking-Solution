// Packages
const jwt = require("jsonwebtoken");
// ENV
const { JWT_SECRET } = process.env;

exports.sendToken = (res, role, user, message, statusCode) => {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15d" });

  const options = {
    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // secure: true,
    sameSite: "none",
  };
  // 15days * 24hours * 60mins * 60secs * 1000ms

  res.status(statusCode).cookie("token", token, options).json({
    message,
    role,
    user,
    token,
  });
};
