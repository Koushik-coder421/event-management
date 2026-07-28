const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/verify-roll', registrationController.verifyRollNumber);
router.post('/verify-otp', protect, registrationController.verifyEntryOTP);
router.post('/', (req, res, next) => {
    // Optional protection: if token exists, verify it, but don't block
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        return protect(req, res, next);
    }
    next();
}, registrationController.registerForEvent);
router.get('/my', protect, registrationController.getMyRegistrations);
router.get('/event/:eventId', protect, registrationController.getEventRegistrations);
router.get('/download-report', protect, registrationController.downloadReport);
router.get('/download-club-report', protect, registrationController.downloadClubReport);
router.delete('/:id', protect, registrationController.cancelRegistration);

module.exports = router;
