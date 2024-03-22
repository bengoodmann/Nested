const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add your first name or full name"],
    maxlength: 50,
  },

  email: {
    type: String,
    required: [true, "Please add your email"],
    unique: [true, "Email already taken"],
  },
  profilePicture: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  passwordResetToken: {
    type: String,
    required: false,
  },
});

const User = mongoose.model("User", userSchema)

module.exports = User