const { body, validationResult } = require("express-validator");

const validateTask = [
  body("title")
    .isLength({ max: 100 })
    .withMessage("Title is 100 characters maximum")
    .notEmpty()
    .withMessage("Title is required"),
  body("category.name").notEmpty().withMessage("Category name is required"),
  body("category.color")
    .optional()
    .isHexColor()
    .withMessage("Invalid category color"),
  body("dueDate").notEmpty().isISO8601().withMessage("Invalid due date"),
  body("reminders.*.reminderDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid reminder date"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = validateTask
