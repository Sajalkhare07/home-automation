// routes/auth.js
const express  = require('express');
const router   = express.Router();

const { signup, login, getMe } = require('../controllers/authController');
const { protect }              = require('../middleware/auth');
const { signupRules, loginRules, handleValidation } = require('../middleware/validate');

// POST /api/auth/signup
router.post('/signup', signupRules, handleValidation, signup);

// POST /api/auth/login
router.post('/login',  loginRules,  handleValidation, login);

// GET  /api/auth/me  (protected)
router.get('/me', protect, getMe);

module.exports = router;