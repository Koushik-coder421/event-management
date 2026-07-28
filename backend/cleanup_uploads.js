const fs = require('fs');
const path = require('path');
const db = require('./config/db');

/**
 * Scans the uploads directory and deletes files not referenced in the database.
 */
async function cleanupOrphanedFiles() {
    console.log("[Cleanup Task] Starting orphaned file cleanup...");

    try {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            console.warn("[Cleanup Task] Uploads directory not found.");
            return;
        }

        const filesOnDisk = fs.readdirSync(uploadsDir);

        // 1. Get all file URLs from Clubs, Events, and Registrations
        const [clubs] = await db.execute('SELECT LogoURL FROM Clubs WHERE LogoURL IS NOT NULL');
        const [events] = await db.execute('SELECT PosterURL, QRCode FROM Events');
        const [registrations] = await db.execute('SELECT PaymentScreenshot FROM Registrations WHERE PaymentScreenshot IS NOT NULL');

        const activeFiles = new Set();

        const addToFileSet = (url) => {
            if (!url) return;
            const filename = url.split('/').pop();
            activeFiles.add(filename);
        };

        clubs.forEach(c => addToFileSet(c.LogoURL));
        events.forEach(e => {
            addToFileSet(e.PosterURL);
            addToFileSet(e.QRCode);
        });
        registrations.forEach(r => addToFileSet(r.PaymentScreenshot));

        // 2. Compare and delete
        let deletedCount = 0;
        filesOnDisk.forEach(file => {
            if (file === '.gitignore' || file === 'placeholder.txt') return;

            if (!activeFiles.has(file)) {
                try {
                    fs.unlinkSync(path.join(uploadsDir, file));
                    deletedCount++;
                } catch (err) {
                    console.error(`[Cleanup Task] Failed to delete ${file}:`, err.message);
                }
            }
        });

        if (deletedCount > 0) {
            console.log(`[Cleanup Task] Success. Deleted ${deletedCount} orphaned files.`);
        } else {
            console.log(`[Cleanup Task] Clean. No orphaned files found.`);
        }
    } catch (err) {
        console.error("[Cleanup Task] Execution error:", err);
    }
}

// Support running directly or as a module
if (require.main === module) {
    cleanupOrphanedFiles().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = cleanupOrphanedFiles;
