const AuditLog = require("../models/AuditLog");
const LoanApplication = require("../models/LoanApplication");

const getAuditTimeline = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the loan application
        const loanApplication = await LoanApplication.findById(id);

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Applicants can only view their own loan timeline
        if (
            req.user.role === "APPLICANT" &&
            loanApplication.applicant.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You are not authorized to view this loan timeline"
            });
        }

        // Fetch audit logs in chronological order
        const timeline = await AuditLog.find({
            loanApplication: loanApplication._id
        })
            .populate("changedBy", "name email role")
            .sort({
                createdAt: 1
            });

        return res.status(200).json({
            message: "Audit timeline fetched successfully",
            count: timeline.length,
            timeline
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAuditTimeline
};
