const { Router } = require("express");
const {
  registerUser,
  loginUser,
  requestUserVerification,
  passwordResetDone,
  changePassword,
  forgottenPasswordRequest,
  editUserProfile,
  uploadProfilePicture,
  upload,
} = require("../controllers/userController");
const authenticateToken = require("../middlewares/authenticate");

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/edit-profile", authenticateToken, editUserProfile);
router.post("/upload/profile-picture", authenticateToken, upload, uploadProfilePicture);
router.post(
  "/request-email-verification",
  authenticateToken,
  requestUserVerification
);
router.post("/forgotten-password", forgottenPasswordRequest);
router.post("/reset-password/:passwordResetToken", passwordResetDone);
router.post("/change-password", authenticateToken, changePassword);

module.exports = router;
