const express = require('express');
const validator = require('../middlewares/validator.middleware');
const authController = require('../controller/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
// Register route with validation and error handling
router.post('/register', validator.registerUserValidations, validator.responseWithValidationErrors, authController.registerUser);
// Login route with validation and error handling
router.post('/login', validator.loginUserValidations, validator.responseWithValidationErrors, authController.loginUser);
// Get current user route with authentication middleware
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;