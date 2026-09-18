const express = require("express");

const {
    uploadDocument,
    getLoanDocuments,
    viewDocument
} = require("../controllers/documentController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Applicant can upload documents
router.post(
    "/:id/documents",
    protect,
    requireRole("APPLICANT"),
    upload.single("document"),
    uploadDocument
);

// Applicant, Loan Officer and Admin can view document metadata
router.get(
    "/:id/documents",
    protect,
    requireRole("APPLICANT", "LOAN_OFFICER", "ADMIN"),
    getLoanDocuments
);

// Applicant, Loan Officer and Admin can view the actual document
router.get(
    "/documents/:documentId/view",
    protect,
    requireRole("APPLICANT", "LOAN_OFFICER", "ADMIN"),
    viewDocument
);

module.exports = router;