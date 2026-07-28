const db = require('../config/db');

async function updateSchema() {
    try {
        console.log('Checking for new columns in Registrations table...');

        // Add EntryOTP column
        try {
            await db.execute("ALTER TABLE Registrations ADD COLUMN EntryOTP VARCHAR(10) AFTER PaymentScreenshot");
            console.log("Added EntryOTP column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("EntryOTP column already exists.");
            } else {
                console.error("Error adding EntryOTP column:", err.message);
            }
        }

        // Add OTPUsed column
        try {
            await db.execute("ALTER TABLE Registrations ADD COLUMN OTPUsed BOOLEAN DEFAULT FALSE AFTER EntryOTP");
            console.log("Added OTPUsed column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("OTPUsed column already exists.");
            } else {
                console.error("Error adding OTPUsed column:", err.message);
            }
        }

        console.log('Schema update complete.');
        process.exit(0);
    } catch (error) {
        console.error('Schema update failed:', error);
        process.exit(1);
    }
}

updateSchema();
