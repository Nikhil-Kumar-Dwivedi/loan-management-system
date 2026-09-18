const LoanApplication = require("../models/LoanApplication");
const Document = require("../models/Document");
const { checkEligibility } = require("../services/eligibilityService");
const { createAuditLog } = require("../services/auditService");

const getOfficerLoans = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            loanType,
            startDate,
            endDate
        } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            50
        );

        const skip = (pageNumber - 1) * limitNumber;

        // Build filters
        const filter = {};

        // By default, officers see applications that are
        // currently part of the review workflow.
        if (status) {
            filter.status = status;
        } else {
            filter.status = {
                $in: [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "MORE_INFO_NEEDED"
                ]
            };
        }

        // Filter by loan type
        if (loanType) {
            filter["loanDetails.loanType"] = loanType;
        }

        // Filter by date range
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);

                if (Number.isNaN(start.getTime())) {
                    return res.status(400).json({
                        message: "Invalid startDate"
                    });
                }

                start.setHours(0, 0, 0, 0);
                filter.createdAt.$gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);

                if (Number.isNaN(end.getTime())) {
                    return res.status(400).json({
                        message: "Invalid endDate"
                    });
                }

                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const [loans, totalLoans] = await Promise.all([
            LoanApplication.find(filter)
                .populate("applicant", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),

            LoanApplication.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalLoans / limitNumber);

        return res.status(200).json({
            message: "Officer loan queue fetched successfully",
            loans,
            pagination: {
                currentPage: pageNumber,
                limit: limitNumber,
                totalLoans,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1
            }
        });

    } catch (error) {
        next(error);
    }
};


const getOfficerLoanDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const loanApplication = await LoanApplication.findById(id)
            .populate("applicant", "name email role")
            .populate(
                "officerReview.officer",
                "name email role"
            )
            .populate(
                "adminReview.admin",
                "name email role"
            )
            .populate(
                "additionalInfoRequests.requestedBy",
                "name email role"
            );

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        return res.status(200).json({
            message: "Officer loan details fetched successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};


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
        let statusChanged = false;
        const previousStatus = loanApplication.status;

        if (loanApplication.status === "SUBMITTED") {
            loanApplication.status = "UNDER_REVIEW";
            statusChanged = true;
        }

        await loanApplication.save();

        if (statusChanged) {
            await createAuditLog({
                loanApplication: loanApplication._id,
                changedBy: req.user._id,
                fromStatus: previousStatus,
                toStatus: "UNDER_REVIEW",
                reason: "Loan application moved to officer review after eligibility check"
            });
        }

        return res.status(200).json({
            message: "Eligibility check completed successfully",
            eligibilityResult,
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};


const reviewLoanApplication = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { recommendation, note } = req.body;

        // Find the loan application
        const loanApplication = await LoanApplication.findById(id);

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Officer can review only applications under review
        if (loanApplication.status !== "UNDER_REVIEW") {
            return res.status(400).json({
                message: "Only applications under review can be reviewed"
            });
        }

        // Validate recommendation
        const allowedRecommendations = [
            "APPROVAL",
            "REJECTION",
            "MORE_INFO"
        ];

        if (!allowedRecommendations.includes(recommendation)) {
            return res.status(400).json({
                message: "Invalid recommendation"
            });
        }

        // Note is required for every officer decision
        if (!note || !note.trim()) {
            return res.status(400).json({
                message: "Review note is required"
            });
        }

        // Save officer review
        loanApplication.officerReview = {
            officer: req.user._id,
            recommendation,
            note: note.trim(),
            reviewedAt: new Date()
        };

        // Store the previous status for the audit trail
        const previousStatus = loanApplication.status;

        // Update status based on recommendation
        if (recommendation === "APPROVAL") {
            loanApplication.status =
                "OFFICER_RECOMMENDED_APPROVAL";
        }

        if (recommendation === "REJECTION") {
            loanApplication.status =
                "OFFICER_RECOMMENDED_REJECTION";
        }

        if (recommendation === "MORE_INFO") {
            loanApplication.status =
                "MORE_INFO_NEEDED";

            loanApplication.additionalInfoRequests.push({
                note: note.trim(),
                requestedBy: req.user._id,
                requestedAt: new Date()
            });
        }

        await loanApplication.save();

        // Create audit trail entry
        await createAuditLog({
            loanApplication: loanApplication._id,
            changedBy: req.user._id,
            fromStatus: previousStatus,
            toStatus: loanApplication.status,
            reason: note.trim(),
            metadata: {
                recommendation
            }
        });

        return res.status(200).json({
            message: "Officer review submitted successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    getOfficerLoans,
    getOfficerLoanDetails,
    checkLoanEligibility,
    reviewLoanApplication
};