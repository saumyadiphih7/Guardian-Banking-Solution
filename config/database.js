const mongoose = require("mongoose");
const { NODE_ENV, MONGODB_URL_DEV, MONGODB_URL_PROD } = process.env;

const connectDB = async (req, res) => {
  try {
    if (NODE_ENV === "production") {
      const conn = await mongoose.connect(MONGODB_URL_PROD);
      console.log(`MONGODB CONNECTED AT :-> "${NODE_ENV}"`.cyan);
      console.log(`MONGODB CONNECTED AT :-> ${conn.connection.host}`.cyan);
    } else {
      const conn = await mongoose.connect(MONGODB_URL_DEV);
      console.log(`MONGODB CONNECTED AT :-> "${NODE_ENV}"`.cyan);
      console.log(`MONGODB CONNECTED AT :-> ${conn.connection.host}`.cyan);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log(`MONGODB DISCONNECTED FROM :-> "${NODE_ENV}" Database`.red);
});

mongoose.connection.on("connected", () => {
  console.log(`MONGODB CONNECTED WITH :-> "${NODE_ENV}" Database`.green);
});

module.exports = connectDB;
