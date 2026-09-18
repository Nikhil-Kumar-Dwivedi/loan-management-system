const express = require("express");

const {
    getOfficerLoans,
    getOfficerLoanDetails,
    checkLoanEligibility,
    reviewLoanApplication
} = require("../controllers/officerController");

const protect = require("../middleware/authMiddleware");

const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// Get officer loan queue
router.get(
    "/loans",
    protect,
    requireRole("LOAN_OFFICER"),
    getOfficerLoans
);

// Get details of a specific loan application
router.get(
    "/loans/:id",
    protect,
    requireRole("LOAN_OFFICER"),
    getOfficerLoanDetails
);

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