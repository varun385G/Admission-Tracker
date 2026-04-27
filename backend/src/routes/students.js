const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { studentValidation } = require('../middleware/validation');
const {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
  bulkUpdateStatus, exportCSV, uploadCSV, confirmUpload
} = require('../controllers/studentsController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(verifyToken);

router.get('/', getStudents);
router.post('/', studentValidation, createStudent);        // staff + admin can add
router.get('/export/csv', requireAdmin, exportCSV);
router.post('/bulk-status', requireAdmin, bulkUpdateStatus);
router.post('/upload', requireAdmin, upload.single('file'), uploadCSV);
router.post('/upload/confirm', requireAdmin, confirmUpload);
router.get('/:id', getStudent);
router.put('/:id', updateStudent);                         // staff can update their own
router.delete('/:id', requireAdmin, deleteStudent);

module.exports = router;