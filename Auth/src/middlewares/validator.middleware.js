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
    body("role")
    .optional()
    .isIn(["user", "seller"])
    .withMessage("role must be either 'user' or 'seller'"),
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

const addUserAddressValidations = [
  body("street")
    .isString()
    .withMessage("street must be a string"),
  body("city")
    .isString()
    .withMessage("city must be a string"),
  body("state")
    .isString()
    .withMessage("state must be a string"),
  body("country")
    .isString()
    .withMessage("country must be a string"),
  body("pincode")
    .matches(/^\d{5,10}$/)
    .withMessage("pincode must contain 5 to 10 digits"),
  body("phone")
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage("phone must be a valid phone number"),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean"),
];


module.exports = {
  registerUserValidations,
  loginUserValidations,
  responseWithValidationErrors,
  addUserAddressValidations,
};
