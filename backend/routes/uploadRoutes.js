const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'campus-connect',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');


function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;

    const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
    );

    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}


router.post('/', (req, res) => {

    upload(req, res, (err) => {

        if (err) {
            return res.status(400).json({ message: err });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'No file selected!'
            });
        }

        // Cloudinary URL
        res.status(200).json({
            message: 'File uploaded!',
            filePath: req.file.path,
            fullUrl: req.file.path
        });

    });

});


module.exports = router;