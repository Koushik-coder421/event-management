const db = require('../config/db');

class Registration {
    static async create(data) {
        const { userId, eventId, rollNumber, studentName, email, branch, section, phoneNumber, year, semester, teamName, teamMembers, transactionId, paymentScreenshot, paymentMode } = data;
        const [result] = await db.execute(
            `INSERT INTO Registrations 
            (UserID, EventID, RollNumber, StudentName, Email, Branch, Section, PhoneNumber, Year, Semester, TeamName, TeamMembers, TransactionID, PaymentScreenshot, EntryOTP, OTPUsed, PaymentMode) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId ?? null,
                eventId ?? null,
                rollNumber ?? null,
                studentName ?? null,
                email ?? null,
                branch ?? null,
                section ?? null,
                phoneNumber ?? null,
                year ?? null,
                semester ?? null,
                teamName ?? null,
                teamMembers ?? null,
                transactionId ?? null,
                paymentScreenshot ?? null,
                data.entryOTP ?? null,
                data.otpUsed ?? false,
                paymentMode ?? 'Online'
            ]
        );
        return result.insertId;
    }

    static async findByUserAndEvent(userId, eventId) {
        const [rows] = await db.execute(
            'SELECT * FROM Registrations WHERE UserID = ? AND EventID = ?',
            [userId, eventId]
        );
        return rows[0];
    }

    static async findByRollAndEvent(rollNumber, eventId) {
        const [rows] = await db.execute(
            'SELECT * FROM Registrations WHERE RollNumber = ? AND EventID = ?',
            [rollNumber, eventId]
        );
        return rows[0];
    }

    static async cancel(registrationId, userId) {
        if (!userId) {
            // Admin override
            const [result] = await db.execute(
                'DELETE FROM Registrations WHERE RegistrationID = ?',
                [registrationId]
            );
            return result.affectedRows;
        }
        const [result] = await db.execute(
            'DELETE FROM Registrations WHERE RegistrationID = ? AND UserID = ?',
            [registrationId, userId]
        );
        return result.affectedRows;
    }

    static async getByUserId(userId) {
        const [rows] = await db.execute(
            `SELECT r.*, e.EventTitle, e.Date, e.Time, e.Venue 
             FROM Registrations r
             JOIN Events e ON r.EventID = e.EventID
             WHERE r.UserID = ?`,
            [userId]
        );
        return rows;
    }
}

module.exports = Registration;
