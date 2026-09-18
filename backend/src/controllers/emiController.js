const EMI = require("../models/EMI");
const LoanApplication = require("../models/LoanApplication");

const getEMISchedule = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the loan application
        const loanApplication = await LoanApplication.findById(id);

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Applicant can only view their own loan
        if (
            req.user.role === "APPLICANT" &&
            loanApplication.applicant.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You do not have permission to view this loan"
            });
        }

        // EMI schedule is available only for approved loans
        if (loanApplication.status !== "APPROVED") {
            return res.status(400).json({
                message: "EMI schedule is available only for approved loans"
            });
        }

        const emiSchedule = await EMI.find({
            loanApplication: id
        }).sort({
            installmentNumber: 1
        });

        return res.status(200).json({
            message: "EMI schedule fetched successfully",
            count: emiSchedule.length,
            emiSchedule
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEMISchedule
};