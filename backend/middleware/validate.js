// middleware/validate.js
const { body, validationResult } = require('express-validator');

// ─── Run validation and return errors if any ──────────────
exports.handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Signup rules ─────────────────────────────────────────
exports.signupRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ─── Login rules ──────────────────────────────────────────
exports.loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Device rules ─────────────────────────────────────────
exports.addDeviceRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Device name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),

  body('type')
    .optional()
    .isIn(['light', 'fan', 'ac', 'socket', 'other'])
    .withMessage('Type must be: light, fan, ac, socket, or other'),

  body('pin')
    .notEmpty().withMessage('Pin number is required')
    .isInt({ min: 0, max: 40 }).withMessage('Pin must be a number between 0–40'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location must be under 100 characters'),
];