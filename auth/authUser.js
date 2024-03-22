const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const { sendEmailVerification } = require("../config/emailVerificationConfig");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const verificationToken = crypto.randomBytes(20).toString("hex");
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      email: email,
      password: hashPassword,
      verificationToken: verificationToken,
    });

    await newUser.save();
    sendEmailVerification(newUser);
    return res.status(201).json(`Created successfully`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal error occurred" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      return res.status(401).json({ error: "Email and password are required" });

    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(401)
        .json({ error: "User with this email doesn't exist" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "The password you entered is wrong" });
    }
    if (user && isPasswordValid) {
      const token = jwt.sign(
        {
          user: {
            name: user.name,
            email: user.email,
            _id: user._id,
          },
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      return res.status(200).json({ "access-token": token });
    }
  } catch (error) {
    console.log("Logging in failed", error);
    return res.status(500).json({ error: "Logging in failed" });
  }
};

module.exports = {registerUser, loginUser};
