const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
});

const schemaPath = path.join(__dirname, 'schema.sql');
let schemaSql = fs.readFileSync(schemaPath, 'utf8');
const databaseName = process.env.DB_NAME || 'campus_connect';

schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS .*?;[\s\S]*?USE .*?;/, `CREATE DATABASE IF NOT EXISTS ${databaseName};\nUSE ${databaseName};`);

console.log('Connecting to database...');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL server:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL server.');

    console.log('Running schema setup...');
    connection.query(schemaSql, async (err, results) => {
        if (err) {
            console.error('Error executing schema:', err);
            connection.end();
            process.exit(1);
        }
        console.log('Database and tables created successfully!');

        // Seed Super Admin
        try {
            // Need to ensure we use the database we just created/selected
            connection.changeUser({ database: process.env.DB_NAME || 'campus_connect' }, async (err) => {
                if (err) {
                    console.error('Error selecting database:', err);
                    connection.end();
                    return;
                }

                const bcrypt = require('bcryptjs');
                const adminEmail = 'admin@campusconnect.com';
                const adminPassword = 'admin';
                const hashedPassword = await bcrypt.hash(adminPassword, 10);

                const checkQuery = "SELECT * FROM Users WHERE Email = ?";
                connection.query(checkQuery, [adminEmail], (err, rows) => {
                    if (err) {
                        console.error('Error checking admin:', err);
                        connection.end();
                        return;
                    }

                    if (rows.length === 0) {
                        console.log('Seeding Super Admin account...');
                        const insertQuery = "INSERT INTO Users (Name, Email, Password, Role, Department) VALUES (?, ?, ?, ?, ?)";
                        connection.query(insertQuery, ['Super Admin', adminEmail, hashedPassword, 'Super Admin', 'Administration'], (err, res) => {
                            if (err) {
                                console.error('Error creating Super Admin:', err);
                            } else {
                                console.log('Super Admin created successfully.');
                                console.log(`Credentials -> Email: ${adminEmail}, Password: ${adminPassword}`);
                            }
                            connection.end();
                        });
                    } else {
                        console.log('Super Admin already exists.');
                        connection.end();
                    }
                });
            });
        } catch (seedErr) {
            console.error('Seeding error:', seedErr);
            connection.end();
        }
    });
});
