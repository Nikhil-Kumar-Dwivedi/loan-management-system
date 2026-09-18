const express = require("express");
const { getAuditTimeline } = require("../controllers/auditController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get audit timeline for a loan application
router.get("/:id/audit", protect, getAuditTimeline);

module.exports = router;
