const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it does not exist
const uploadDirectory = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure where uploaded files will be stored
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

        cb(null, uniqueName);
    }
});

// Allow only PDF, JPG and PNG files
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, JPG and PNG files are allowed"));
    }
};

// Configure Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

module.exports = upload;