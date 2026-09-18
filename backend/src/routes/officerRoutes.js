const express = require("express");

const {
    checkLoanEligibility,
    reviewLoanApplication
} = require("../controllers/officerController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// Run eligibility check for a loan application
router.post(
    "/loans/:id/eligibility",
    protect,
    requireRole("LOAN_OFFICER"),
    checkLoanEligibility
);

// Submit officer recommendation
router.post(
    "/loans/:id/review",
    protect,
    requireRole("LOAN_OFFICER"),
    reviewLoanApplication
);

module.exports = router;