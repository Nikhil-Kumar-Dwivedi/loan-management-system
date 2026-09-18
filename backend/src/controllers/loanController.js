const LoanApplication = require("../models/LoanApplication");
const { calculateEMI } = require("../services/emiService");

const createLoanApplication = async (req, res, next) => {
    try {
        const loanApplication = await LoanApplication.create({
            applicant: req.user._id
        });

        return res.status(201).json({
            message: "Loan application draft created successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};

const updateLoanApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        const loanApplication = await LoanApplication.findOne({
            _id: id,
            applicant: req.user._id
        });

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Only drafts can be edited
        if (loanApplication.status !== "DRAFT") {
            return res.status(400).json({
                message: "Only draft applications can be edited"
            });
        }

        const {
            personalDetails,
            loanDetails,
            incomeDetails
        } = req.body;

        if (personalDetails) {
            loanApplication.personalDetails = {
                ...loanApplication.personalDetails,
                ...personalDetails
            };
        }

        if (loanDetails) {
            loanApplication.loanDetails = {
                ...loanApplication.loanDetails,
                ...loanDetails
            };
        }

        if (incomeDetails) {
            loanApplication.incomeDetails = {
                ...loanApplication.incomeDetails,
                ...incomeDetails
            };
        }

        // Set sample interest rate based on loan type
        if (loanApplication.loanDetails.loanType) {
            const rates = {
                PERSONAL: 12,
                HOME: 8.5,
                VEHICLE: 9.5,
                BUSINESS: 11
            };

            loanApplication.interestRate =
                rates[loanApplication.loanDetails.loanType];
        }

        // Calculate estimated EMI
        if (
            loanApplication.loanDetails.amount &&
            loanApplication.loanDetails.tenure &&
            loanApplication.interestRate
        ) {
            loanApplication.estimatedEMI = calculateEMI(
                loanApplication.loanDetails.amount,
                loanApplication.interestRate,
                loanApplication.loanDetails.tenure
            );
        }

        await loanApplication.save();

        return res.status(200).json({
            message: "Loan application updated successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createLoanApplication,
    updateLoanApplication
};