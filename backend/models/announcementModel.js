const db = require('../config/db');

class Announcement {
    static async create(eventId, message) {
        const [result] = await db.execute(
            'INSERT INTO Announcements (EventID, Message) VALUES (?, ?)',
            [eventId, message]
        );
        return result.insertId;
    }

    static async findByEventId(eventId) {
        const [rows] = await db.execute('SELECT * FROM Announcements WHERE EventID = ? ORDER BY CreatedAt DESC', [eventId]);
        return rows;
    }
}

module.exports = Announcement;
