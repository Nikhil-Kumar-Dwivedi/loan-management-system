const express = require("express");

const {
    createLoanApplication,
    updateLoanApplication,
    submitLoanApplication,
    getMyLoans,
    getLoanById,
    respondToMoreInfoRequest
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

router.get(
    "/my",
    protect,
    requireRole("APPLICANT"),
    getMyLoans
);

router.get(
    "/:id",
    protect,
    requireRole("APPLICANT"),
    getLoanById
);

router.patch(
    "/:id",
    protect,
    requireRole("APPLICANT"),
    updateLoanApplication
);

router.post(
    "/:id/respond",
    protect,
    requireRole("APPLICANT"),
    respondToMoreInfoRequest
);

router.post(
    "/:id/submit",
    protect,
    requireRole("APPLICANT"),
    submitLoanApplication
);

module.exports = router;
