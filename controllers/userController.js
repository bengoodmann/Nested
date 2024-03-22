const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");

const User = require("../models/userModel");

const {
  sendEmailVerification,
  sendPasswordResetMail,
} = require("../config/emailVerificationConfig");

require("dotenv").config();

const userVerification = async (req, res) => {
  const verificationToken = req.params.verificationToken;
  const user = await User.findOne({ verificationToken: verificationToken });
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
    const user = await User.findOne({ email: email });
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
  const user = await User.findOne({ passwordResetToken: token });

  if (!user) {
    res.status(404).json("User not found");
  }
  const newPassword = req.body.newPassword;
  if (!newPassword) {
    return res.status(400).json({ error: "Your new password is required" });
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);
  const updateDetails = {
    password: hashPassword,
  };
  await user.updateOne({_id: user._id},{$set: updateDetails  });
  return res.status(200).json("Password was changed successfully");
};

const editUserProfile = async (req, res) => {
  const user = req.user;
  const { name } = req.body;
  const updateDetails = {
    name: name || user.name,
  };
  await User.updateOne({ _id: user._id }, {$set: updateDetails});
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
    cb(null, `${req.user._id}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage }).single("profilePicture");

const uploadProfilePicture = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const updateFile = { profilePicture: req.file.filename };

    await User.updateOne({ _id: user._id }, { $set: updateFile });
    return res.json({
      message: "Profile picture uploaded successfully",
    });
  } catch (error) {
    console.log(error)
    res.status(500).json("Internal error")
  }
  
};

module.exports = {
  userVerification,
  requestUserVerification,
  changePassword,
  forgottenPasswordRequest,
  passwordResetDone,
  editUserProfile,
  uploadProfilePicture,
  upload,
};
