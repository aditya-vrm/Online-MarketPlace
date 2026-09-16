const express = require('express');
const validator = require('../middlewares/validator.middleware');
const authController = require('../controller/auth.controller');

const router = express.Router();

router.post('/register', validator.registerUserValidations, validator.responseWithValidationErrors, authController.registerUser);
router.post('/login', validator.loginUserValidations, validator.responseWithValidationErrors, authController.loginUser);

module.exports = router;