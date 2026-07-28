const db = require('../config/db');

class Notification {
    static async create(userId, title, message, type) {
        const [result] = await db.execute(
            'INSERT INTO Notifications (UserID, Title, Message, Type) VALUES (?, ?, ?, ?)',
            [userId, title, message, type || 'General']
        );
        return result.insertId;
    }

    static async getByUserId(userId) {
        const [rows] = await db.execute('SELECT * FROM Notifications WHERE UserID = ? ORDER BY CreatedAt DESC', [userId]);
        return rows;
    }

    static async markAsRead(notificationId, userId) {
        const [result] = await db.execute(
            'UPDATE Notifications SET IsRead = TRUE WHERE NotificationID = ? AND UserID = ?',
            [notificationId, userId]
        );
        return result.affectedRows;
    }
}

module.exports = Notification;
