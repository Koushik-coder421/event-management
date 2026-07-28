const db = require('../config/db');

class Club {
    static async create(clubData) {
        const { clubName, description, logoUrl, createdBy } = clubData;
        const [result] = await db.execute(
            'INSERT INTO Clubs (ClubName, Description, LogoURL, CreatedBy) VALUES (?, ?, ?, ?)',
            [clubName, description, logoUrl, createdBy]
        );
        return result.insertId;
    }

    static async findAll() {
        const [rows] = await db.execute('SELECT * FROM Clubs');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM Clubs WHERE ClubID = ?', [id]);
        return rows[0];
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM Clubs WHERE ClubID = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Club;
