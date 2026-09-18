const express = require("express");

const {
    checkLoanEligibility
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

module.exports = router;