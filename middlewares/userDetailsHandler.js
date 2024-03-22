const { body, validationResult } = require("express-validator");
const User = require("../models/userModel");

const validate = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Name can't be longer than 50 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email already taken");
      }
    }),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .isAlphanumeric()
    .withMessage("Password must contain alphanumeric characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = validate