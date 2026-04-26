const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().isLength({ min: 6 }),
  handleValidation,
];

const studentValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').trim().notEmpty().matches(/^\d{10}$/).withMessage('Valid 10-digit phone required'),
  body('status').optional().isIn([
    'New Enquiry', 'Contacted', 'Counselling Scheduled',
    'Document Submitted', 'Admitted', 'Rejected', 'Not Interested'
  ]),
  handleValidation,
];

const noteValidation = [
  body('note_text').trim().notEmpty().withMessage('Note text is required'),
  body('student_id').notEmpty().withMessage('student_id is required'),
  handleValidation,
];

const userValidation = [
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 8 }),
  body('role').optional().isIn(['admin', 'staff']),
  handleValidation,
];

module.exports = { loginValidation, studentValidation, noteValidation, userValidation, sanitizeString };
