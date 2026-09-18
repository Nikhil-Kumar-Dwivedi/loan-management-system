const express = require("express");

const { getEMISchedule } = require("../controllers/emiController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/:id/emi",
    protect,
    getEMISchedule
);

module.exports = router;