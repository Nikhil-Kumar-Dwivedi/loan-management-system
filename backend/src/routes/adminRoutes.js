const express = require("express");

const { makeFinalDecision } = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/loans/:id/decision",
    protect,
    requireRole("ADMIN"),
    makeFinalDecision
);

module.exports = router;