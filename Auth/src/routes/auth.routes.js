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
// Logout route with authentication middleware
router.post('/logout', authMiddleware, authController.logoutUser);
// Get Address 
router.get('/user/me/addresses', authMiddleware, authController.getUserAddresses);
// Add Address 
router.post('/user/me/addresses', authMiddleware, validator.addUserAddressValidations, validator.responseWithValidationErrors, authController.addUserAddress);
//Delete Address
router.delete('/user/me/addresses/:addressId', authMiddleware, authController.deleteUserAddress);

module.exports = router;