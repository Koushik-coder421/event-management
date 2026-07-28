const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM Users WHERE Email = ?', [email]);
        return rows[0];
    }

    static async create(userData) {
        const { name, email, password, role, department } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO Users (Name, Email, Password, Role, Department) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'Student', department]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT UserID, Name, Email, Role, Department FROM Users WHERE UserID = ?', [id]);
        return rows[0];
    }

    static async findAll() {
        const [rows] = await db.execute('SELECT UserID, Name, Email, Role, Department FROM Users');
        return rows;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM Users WHERE UserID = ?', [id]);
        return result.affectedRows > 0;
    }

    static async update(id, userData) {
        let query = 'UPDATE Users SET Name = ?, Email = ?, Department = ?';
        const params = [userData.name, userData.email, userData.department];

        if (userData.password) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            query += ', Password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE UserID = ?';
        params.push(id);

        const [result] = await db.execute(query, params);
        return result.affectedRows > 0;
    }
}

module.exports = User;
