const mongoose = require("mongoose");
require("dotenv").config();

const connectionString = process.env.CONNECTION_STRING;

const dbConnector = async () => {
  try {
    await mongoose.connect(connectionString);
    
    console.log("Database connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};


module.exports = dbConnector