const db = require('../config/db');

class Event {
    static async create(eventData) {
        const { eventTitle, description, rules, eventType, teamSize, entryFee, date, time, venue, posterUrl, qrCode, maxParticipants, registrationDeadline, clubId } = eventData;

        const [result] = await db.execute(
            'INSERT INTO Events (EventTitle, Description, Rules, EventType, TeamSize, EntryFee, Date, Time, Venue, PosterURL, QRCode, MaxParticipants, RegistrationDeadline, ClubID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [eventTitle, description, rules, eventType || 'Single', teamSize || 1, entryFee || 0, date, time, venue, posterUrl, qrCode, maxParticipants, registrationDeadline, clubId]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await db.execute(`
            SELECT Events.*, Clubs.ClubName as ClubName, Clubs.ClubName as categoryName, Clubs.LogoURL as categoryLogo
            FROM Events 
            LEFT JOIN Clubs ON Events.ClubID = Clubs.ClubID
        `);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.execute(`
            SELECT Events.*, Clubs.ClubName as ClubName, Clubs.ClubName as categoryName, Clubs.LogoURL as categoryLogo, Clubs.CreatedBy as clubOwnerId
            FROM Events 
            LEFT JOIN Clubs ON Events.ClubID = Clubs.ClubID
            WHERE EventID = ?
        `, [id]);
        return rows[0];
    }

    static async update(id, eventData) {
        const { eventTitle, description, rules, eventType, teamSize, entryFee, date, time, venue, posterUrl, qrCode, maxParticipants, registrationDeadline } = eventData;

        const [result] = await db.execute(
            `UPDATE Events SET 
            EventTitle = ?, Description = ?, Rules = ?, EventType = ?, 
            TeamSize = ?, EntryFee = ?, Date = ?, Time = ?, 
            Venue = ?, PosterURL = ?, QRCode = ?, MaxParticipants = ?, RegistrationDeadline = ? 
            WHERE EventID = ?`,
            [eventTitle, description, rules, eventType, teamSize, entryFee, date, time, venue, posterUrl, qrCode, maxParticipants, registrationDeadline, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM Events WHERE EventID = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Event;
