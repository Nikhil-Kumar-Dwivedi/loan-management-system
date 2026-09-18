const LoanApplication = require("../models/LoanApplication");

const makeFinalDecision = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { decision, remarks } = req.body;

        // Find the loan application
        const loanApplication = await LoanApplication.findById(id);

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Admin can make a final decision only after officer recommendation
        const allowedStatuses = [
            "OFFICER_RECOMMENDED_APPROVAL",
            "OFFICER_RECOMMENDED_REJECTION"
        ];

        if (!allowedStatuses.includes(loanApplication.status)) {
            return res.status(400).json({
                message: "Application is not ready for final admin decision"
            });
        }

        // Validate decision
        const allowedDecisions = [
            "APPROVED",
            "REJECTED"
        ];

        if (!allowedDecisions.includes(decision)) {
            return res.status(400).json({
                message: "Invalid admin decision"
            });
        }

        // Remarks are required
        if (!remarks || !remarks.trim()) {
            return res.status(400).json({
                message: "Admin remarks are required"
            });
        }

        // Save admin review
        loanApplication.adminReview = {
            admin: req.user._id,
            decision,
            remarks: remarks.trim(),
            decidedAt: new Date()
        };

        // Update final status
        if (decision === "APPROVED") {
            loanApplication.status = "APPROVED";
        }

        if (decision === "REJECTED") {
            loanApplication.status = "REJECTED";
        }

        await loanApplication.save();

        return res.status(200).json({
            message: "Final admin decision submitted successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    makeFinalDecision
};