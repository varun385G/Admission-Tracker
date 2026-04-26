const express = require('express');
const router = express.Router();
const { login, refresh, logout, me } = require('../controllers/authController');
const { loginValidation } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

router.post('/login', loginValidation, login);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, me);

module.exports = router;
