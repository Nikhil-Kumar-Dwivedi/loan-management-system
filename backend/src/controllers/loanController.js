const LoanApplication = require("../models/LoanApplication");
const Document = require("../models/Document");
const { calculateEMI } = require("../services/emiService");
const { createAuditLog } = require("../services/auditService");

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

const submitLoanApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find the loan belonging to the logged-in applicant
        const loanApplication = await LoanApplication.findOne({
            _id: id,
            applicant: req.user._id
        });

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Only drafts can be submitted
        if (loanApplication.status !== "DRAFT") {
            return res.status(400).json({
                message: "Only draft applications can be submitted"
            });
        }

        const missingFields = [];

        // Check personal details
        if (!loanApplication.personalDetails?.fullName) {
            missingFields.push("Full name");
        }

        if (!loanApplication.personalDetails?.dateOfBirth) {
            missingFields.push("Date of birth");
        }

        if (!loanApplication.personalDetails?.panNumber) {
            missingFields.push("PAN/ID number");
        }

        if (!loanApplication.personalDetails?.address) {
            missingFields.push("Address");
        }

        // Check loan details
        if (!loanApplication.loanDetails?.loanType) {
            missingFields.push("Loan type");
        }

        if (!loanApplication.loanDetails?.amount) {
            missingFields.push("Loan amount");
        }

        if (!loanApplication.loanDetails?.tenure) {
            missingFields.push("Loan tenure");
        }

        if (!loanApplication.loanDetails?.purpose) {
            missingFields.push("Loan purpose");
        }

        // Check income details
        if (!loanApplication.incomeDetails?.monthlyIncome) {
            missingFields.push("Monthly income");
        }

        if (!loanApplication.incomeDetails?.employmentType) {
            missingFields.push("Employment type");
        }

        // Check required documents
        const documents = await Document.find({
            loanApplication: loanApplication._id
        });

        const hasIdProof = documents.some(
            (document) => document.documentType === "ID_PROOF"
        );

        const hasIncomeProof = documents.some(
            (document) => document.documentType === "INCOME_PROOF"
        );

        if (!hasIdProof) {
            missingFields.push("ID proof");
        }

        if (!hasIncomeProof) {
            missingFields.push("Income proof");
        }

        // Stop submission if anything is missing
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: "Application is incomplete",
                missingFields
            });
        }

        const previousStatus = loanApplication.status;

        // Submit the application
        loanApplication.status = "SUBMITTED";
        loanApplication.submittedAt = new Date();

        await loanApplication.save();

        await createAuditLog({
            loanApplication: loanApplication._id,
            changedBy: req.user._id,
            fromStatus: previousStatus,
            toStatus: "SUBMITTED",
            reason: "Loan application submitted by applicant"
        });

        return res.status(200).json({
            message: "Loan application submitted successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};

const getMyLoans = async (req, res, next) => {
    try {
        const loanApplications = await LoanApplication.find({
            applicant: req.user._id
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            message: "Loan applications fetched successfully",
            count: loanApplications.length,
            loanApplications
        });

    } catch (error) {
        next(error);
    }
};

const getLoanById = async (req, res, next) => {
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

        return res.status(200).json({
            message: "Loan application fetched successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};

const respondToMoreInfoRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { response } = req.body;

        // Find the loan belonging to the logged-in applicant
        const loanApplication = await LoanApplication.findOne({
            _id: id,
            applicant: req.user._id
        });

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Applicant can respond only when more information is requested
        if (loanApplication.status !== "MORE_INFO_NEEDED") {
            return res.status(400).json({
                message: "Application is not waiting for additional information"
            });
        }

        // Response is required
        if (!response || !response.trim()) {
            return res.status(400).json({
                message: "Response is required"
            });
        }

        const previousStatus = loanApplication.status;

        // Mark the latest information request as responded
        const latestRequest =
            loanApplication.additionalInfoRequests[
                loanApplication.additionalInfoRequests.length - 1
            ];

        if (latestRequest) {
            latestRequest.respondedAt = new Date();
        }

        // Move application back to submitted
        loanApplication.status = "SUBMITTED";

        await loanApplication.save();

        // Create audit trail entry
        await createAuditLog({
            loanApplication: loanApplication._id,
            changedBy: req.user._id,
            fromStatus: previousStatus,
            toStatus: "SUBMITTED",
            reason: response.trim()
        });

        return res.status(200).json({
            message: "Additional information submitted successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};



module.exports = {
    createLoanApplication,
    updateLoanApplication,
    submitLoanApplication,
    getMyLoans,
    getLoanById,
    respondToMoreInfoRequest
};