const LoanApplication = require("../models/LoanApplication");
const Document = require("../models/Document");
const { checkEligibility } = require("../services/eligibilityService");

const checkLoanEligibility = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the submitted loan application
        const loanApplication = await LoanApplication.findById(id);

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Fetch documents associated with the loan
        const documents = await Document.find({
            loanApplication: loanApplication._id
        });

        // Run deterministic eligibility checks
        const eligibilityResult = checkEligibility({
            loanApplication,
            documents
        });

        // Save eligibility result
        loanApplication.eligibilityResult = eligibilityResult;

        // Move submitted application into review
        if (loanApplication.status === "SUBMITTED") {
            loanApplication.status = "UNDER_REVIEW";
        }

        await loanApplication.save();

        return res.status(200).json({
            message: "Eligibility check completed successfully",
            eligibilityResult,
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkLoanEligibility
};