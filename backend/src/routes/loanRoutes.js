const express = require("express");

const {
    createLoanApplication,
    updateLoanApplication,
    submitLoanApplication
} = require("../controllers/loanController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    protect,
    requireRole("APPLICANT"),
    createLoanApplication
);

router.patch(
    "/:id",
    protect,
    requireRole("APPLICANT"),
    updateLoanApplication
);

router.post(
    "/:id/submit",
    protect,
    requireRole("APPLICANT"),
    submitLoanApplication
);

module.exports = router;