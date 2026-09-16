const { body, validationResult } = require("express-validator");

const responseWithValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }

  next();
}

const registerUserValidations = [
  body("username")
  .isString().withMessage("username must be a string")
  .isLength({ min: 3 }).withMessage("username must be at least 3 characters"),
  body("email")
    .isEmail()
    .withMessage("email must be valid")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters"),
    body("fullname")
    .isObject().withMessage("fullname must be an object")
    .notEmpty().withMessage("fullname is required"),
    body("fullname.firstname")
    .isString().withMessage("firstname must be a string")
    .trim()
    .notEmpty().withMessage("firstname is required"),
    body("fullname.lastname")
    .isString().withMessage("lastname must be a string")
    .trim()
    .notEmpty().withMessage("lastname is required"),
];

const loginUserValidations = [
  body("email")
  .optional()
    .isEmail()
    .withMessage("email must be valid"),
    body("username")
    .optional()
    .isString()
    .withMessage("username must be a string"),
  body("password")
    .isString()
    .withMessage("password must be a string"),
];


module.exports = {
  registerUserValidations,
  loginUserValidations,
  responseWithValidationErrors,
};
