const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const User = require("../models/userModel");
const userSchema = require("../schema/schema");

const {
  sendEmailVerification,
  sendPasswordResetMail,
} = require("../config/emailVerificationConfig");

require("dotenv").config();

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const validate = userSchema.validate(req.body);
    if (validate.error) {
      return res.status(400).json({ error: validate.error.details[0].message });
    }
    const checkEmail = await User.findOne({ where: { email } });
    if (checkEmail) {
      return res.status(401).json({ error: "User with this email exists" });
    }
    const verificationToken = crypto.randomBytes(20).toString("hex");
    const hashPassword = await bcrypt.hash(password, 10);

    const canvas = createCanvas(200, 200, "pdf");
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#3498db";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "80px Arial";
    ctx.fillStyle = "#ffffff"; // Text color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      name.charAt(0).toUpperCase(),
      canvas.width / 2,
      canvas.height / 2
    );

    const profilePicture = canvas.toDataURL();

    const newUser = await User.create({
      name: name,
      email: email,
      verificationToken: verificationToken,
      password: hashPassword,
      profilePicture: profilePicture,
    });
    sendEmailVerification(newUser);
    return res.status(201).json({
      "User created successfully": {
        name: newUser.name,
        email: newUser.email,
        verified: newUser.verified,
      },
    });
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

    const user = await User.findOne({ where: { email } });
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
            id: user.id,
          },
        },
        process.env.JWT_SECRET,
        { expiresIn: "60m" }
      );
      return res.status(200).json({ "access-token": token });
    }
  } catch (error) {
    console.log("Registration failed", error);
    return res.status(500).json({ error: "Registration failed" });
  }
};

const userVerification = async (req, res) => {
  const verificationToken = req.params.verificationToken;
  const user = await User.findOne({ where: { verificationToken } });
  if (!user) {
    return res.status(404).json("User not found");
  }
  if (!user.verified) {
    await user.update({ verified: true });
    return res.status(200).json("Email verified successfully");
  } else {
    return res.status(401).json("Email verified already");
  }
};

const requestUserVerification = async (req, res) => {
  const user = req.user;
  if (!user.verified) {
    user.verificationToken = null;
    const newVerificationToken = crypto.randomBytes(20).toString("hex");
    user.verificationToken = newVerificationToken;
    sendEmailVerification(user);
    return res
      .status(200)
      .json("Check your email. Verification message has been sent");
  }
  return res.status(401).json("Email verified already");
};

const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      return res
        .status(400)
        .json({ error: "Old and new passwords are required" });
    }
    const checkPassword = await bcrypt.compare(oldPassword, user.password);
    if (!checkPassword) {
      return res.status(401).json("Your old password is incorrect");
    }
    const hashNewPassword = await bcrypt.hash(newPassword, 10);
    await User.update(
      { password: hashNewPassword },
      { where: { id: user.id } }
    );
    return res.status(200).json("Password changed successfully");
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "An error occurred while changing the password" });
  }
};

const forgottenPasswordRequest = async (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ error: "Your email is required" });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json("User doesn't exist");
    }
    const token = crypto.randomBytes(20).toString("hex");
    await user.update({ passwordResetToken: token });
    await sendPasswordResetMail(user);
    return res.status(200).json("Check your inbox for the reset email");
  } catch (error) {
    console.log(error);
    return res.status(500).json("Internal server error");
  }
};

const passwordResetDone = async (req, res) => {
  const token = req.params.passwordResetToken;
  const user = await User.findOne({ where: { passwordResetToken: token } });

  if (!user) {
    res.status(404).json("User not found");
  }
  const newPassword = req.body.newPassword;
  if (!newPassword) {
    return res.status(400).json({ error: "Your new password is required" });
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashPassword });
  return res.status(200).json("Password was changed successfully");
};

const editUserProfile = async (req, res) => {
  const user = req.user;
  const { name } = req.body;
  const updateDetails = {
    name: name || user.name,
  };
  await User.update(updateDetails, { where: { id: user.id } });
  return res.status(200).json("User updated successfully");
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destinationDir = path.join(
      __dirname,
      "..",
      "..",
      "nested",
      "public",
      "profile-pictures"
    );
    cb(null, destinationDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage }).single("profilePicture");

const uploadProfilePicture = async (req, res) => {
  const user = req.user;
  if(!user){
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filename = req.file.filename;
  await User.update({ profilePicture: filename }, { where: { id: user.id } });
  return res.json({
    message: "Profile picture uploaded successfully",
    filename,
  });
};

module.exports = {
  registerUser,
  loginUser,
  userVerification,
  requestUserVerification,
  changePassword,
  forgottenPasswordRequest,
  passwordResetDone,
  editUserProfile,
  uploadProfilePicture,
  upload,
};
