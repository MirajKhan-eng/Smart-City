const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");

// This defines the URL: https://smart-city-1-42tj.onrender.com/api/auth/register
router.post("/register", authController.register);
// Add this below your register route
router.post("/login", authController.login);

module.exports = router;
