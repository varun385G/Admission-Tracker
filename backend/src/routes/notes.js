const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { noteValidation } = require('../middleware/validation');
const { createNote, getNotesForStudent } = require('../controllers/notesController');

router.use(verifyToken);
router.post('/', noteValidation, createNote);
router.get('/student/:studentId', getNotesForStudent);

module.exports = router;
