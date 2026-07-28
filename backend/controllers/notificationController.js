const Notification = require('../models/notificationModel');

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.getByUserId(req.user.id);
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.markAsRead(req.params.id, req.user.id);
        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
