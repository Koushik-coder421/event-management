const fs = require('fs');
const path = require('path');

/**
 * Deletes a file from the uploads folder given its full URL or filename
 * @param {string} fileUrl The full URL or path of the file to delete
 */
const deleteFile = (fileUrl) => {
    if (!fileUrl) return;

    try {
        // Handle URLs like http://localhost:3000/uploads/IMAGE-123.jpg
        // or relative paths like /uploads/IMAGE-123.jpg
        const parts = fileUrl.split('/');
        const filename = parts[parts.length - 1];

        // Ensure we're only looking in the backend/uploads directory
        const filePath = path.join(__dirname, '..', 'uploads', filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted orphaned file: ${filename}`);
        }
    } catch (err) {
        console.error(`Error deleting file ${fileUrl}:`, err);
    }
};

module.exports = { deleteFile };
