const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const { getUsers, createUser, updateUser, toggleActive, deleteUser } = require('../controllers/usersController');

router.use(verifyToken, requireAdmin);
router.get('/', getUsers);
router.post('/', userValidation, createUser);
router.put('/:id', userValidation, updateUser);
router.patch('/:id/toggle-active', toggleActive);
router.delete('/:id', deleteUser);

module.exports = router;
