const express = require("express");

const {
    uploadDocument
} = require("../controllers/documentController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Upload a document for a loan application
router.post(
    "/:id/documents",
    protect,
    requireRole("APPLICANT"),
    upload.single("document"),
    uploadDocument
);

module.exports = router;