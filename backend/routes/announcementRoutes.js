const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, announcementController.createAnnouncement);
router.get('/:eventId', announcementController.getAnnouncementsByEvent);

module.exports = router;
