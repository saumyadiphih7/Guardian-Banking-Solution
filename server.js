const express = require("express");
require("dotenv").config();
require("colors");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const { NODE_ENV, PORT } = process.env;
// Database
const connectDB = require("./config/database");
connectDB();
// Requires
const errorHandler = require("./middleware/errorMiddleware");
// Routes
const adminRoutes = require("./routes/adminRoutes");
const bankRoutes = require("./routes/bankRoutes");
const operatorRoutes = require("./routes/operatorRoutes");
const userRoutes = require("./routes/userRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors("*"));

// Test Route
app.get("/", (req, res) =>
  res.send(
    `Guardian Banking Solutions -> Server Running Successfully on "${NODE_ENV}"!`
  )
);

// Routes Middleware
app.use("/admin", adminRoutes);
app.use("/bank", bankRoutes);
app.use("/applicant", operatorRoutes);
app.use("/user", userRoutes);

// Error Handler Middleware
app.use(errorHandler);

// App Running
app.listen(PORT, () => {
  if (NODE_ENV === "production") {
    console.log(`SERVER RUNNING ON :-> "${NODE_ENV}"!`.cyan);
    console.log(`SERVER LISTENING ON PORT :-> ${PORT}!`.green);
  } else {
    console.log(`SERVER RUNNING ON :-> "${NODE_ENV}"!`.cyan);
    console.log(`SERVER LISTENING ON PORT :-> ${PORT}!`.green);
  }
});
