const express = require("express");

const {
    createLoanApplication,
    updateLoanApplication
} = require("../controllers/loanController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// Applicant creates a new loan application draft
router.post(
    "/",
    protect,
    requireRole("APPLICANT"),
    createLoanApplication
);

// Applicant updates their own draft loan application
router.patch(
    "/:id",
    protect,
    requireRole("APPLICANT"),
    updateLoanApplication
);

module.exports = router;