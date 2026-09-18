const express = require("express");

const {
    getAdminUsers,
    createAdminUser,
    updateAdminUser,
    getAdminLoans,
    getAdminLoanDetails,
    makeFinalDecision
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// ===============================
// USER MANAGEMENT
// ===============================

// Get all users
router.get(
    "/users",
    protect,
    requireRole("ADMIN"),
    getAdminUsers
);

// Create a new user
router.post(
    "/users",
    protect,
    requireRole("ADMIN"),
    createAdminUser
);

// Update user role / active status
router.patch(
    "/users/:id",
    protect,
    requireRole("ADMIN"),
    updateAdminUser
);


// ===============================
// LOAN MANAGEMENT
// ===============================

// Get all loan applications
router.get(
    "/loans",
    protect,
    requireRole("ADMIN"),
    getAdminLoans
);

// Get complete loan details
router.get(
    "/loans/:id",
    protect,
    requireRole("ADMIN"),
    getAdminLoanDetails
);

// Make final approve/reject decision
router.post(
    "/loans/:id/decision",
    protect,
    requireRole("ADMIN"),
    makeFinalDecision
);

module.exports = router;