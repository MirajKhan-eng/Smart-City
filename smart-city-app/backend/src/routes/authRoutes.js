const express = require("express");
const router = express.Router();
const authController = require('../controllers/authController.js');

// This defines the URL: http://localhost:5000/api/auth/register
router.post("/register", authController.register);
// Add this below your register route
router.post('/login', authController.login);

module.exports = router;
