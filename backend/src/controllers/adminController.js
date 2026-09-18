const bcrypt = require("bcryptjs");
const User = require("../models/User");

const LoanApplication = require("../models/LoanApplication");
const { generateEMISchedule } = require("../services/emiService");
const { createAuditLog } = require("../services/auditService");

const getAdminUsers = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            isActive
        } = req.query;

        const currentPage = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const currentLimit = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            50
        );

        const skip = (currentPage - 1) * currentLimit;

        const filter = {};

        // Optional role filter
        if (role) {
            const allowedRoles = [
                "APPLICANT",
                "LOAN_OFFICER",
                "ADMIN"
            ];

            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    message: "Invalid user role"
                });
            }

            filter.role = role;
        }

        // Optional active/inactive filter
        if (isActive !== undefined) {
            if (
                isActive !== "true" &&
                isActive !== "false"
            ) {
                return res.status(400).json({
                    message: "isActive must be true or false"
                });
            }

            filter.isActive = isActive === "true";
        }

        const [users, totalUsers] = await Promise.all([
            User.find(filter)
                .select(
                    "_id name email role isActive createdAt updatedAt"
                )
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(currentLimit),

            User.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(
            totalUsers / currentLimit
        );

        return res.status(200).json({
            message: "Admin users fetched successfully",
            users,
            pagination: {
                currentPage,
                limit: currentLimit,
                totalUsers,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            }
        });

    } catch (error) {
        next(error);
    }
};


const createAdminUser = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            role
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message:
                    "Name, email, password and role are required"
            });
        }

        // Validate role
        const allowedRoles = [
            "APPLICANT",
            "LOAN_OFFICER",
            "ADMIN"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid user role"
            });
        }

        // Check duplicate email
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            12
        );

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        next(error);
    }
};

const updateAdminUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            role,
            isActive
        } = req.body;

        // Admin cannot modify their own account
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot modify your own account"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Validate role if provided
        if (role !== undefined) {
            const allowedRoles = [
                "APPLICANT",
                "LOAN_OFFICER",
                "ADMIN"
            ];

            if (!allowedRoles.includes(role)) {
                return res.status(400).json({
                    message: "Invalid user role"
                });
            }

            user.role = role;
        }

        // Validate active status if provided
        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return res.status(400).json({
                    message: "isActive must be a boolean"
                });
            }

            user.isActive = isActive;

            // Invalidate refresh token when deactivating
            if (isActive === false) {
                user.refreshToken = undefined;
            }
        }

        // Require at least one update
        if (
            role === undefined &&
            isActive === undefined
        ) {
            return res.status(400).json({
                message:
                    "Provide role or isActive to update the user"
            });
        }

        await user.save();

        return res.status(200).json({
            message: "User updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        next(error);
    }
};

const getAdminLoans = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            loanType,
            startDate,
            endDate
        } = req.query;

        const currentPage = Math.max(parseInt(page, 10) || 1, 1);
        const currentLimit = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            50
        );

        const skip = (currentPage - 1) * currentLimit;

        const filter = {};

        // Optional status filter
        if (status) {
            filter.status = status;
        }

        // Optional loan type filter
        if (loanType) {
            filter["loanDetails.loanType"] = loanType;
        }

        // Optional date range filter
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);

                if (isNaN(start.getTime())) {
                    return res.status(400).json({
                        message: "Invalid startDate"
                    });
                }

                filter.createdAt.$gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);

                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        message: "Invalid endDate"
                    });
                }

                // Include the entire end date
                end.setHours(23, 59, 59, 999);

                filter.createdAt.$lte = end;
            }
        }

        const [loans, totalLoans] = await Promise.all([
            LoanApplication.find(filter)
                .populate(
                    "applicant",
                    "name email role"
                )
                .populate(
                    "officerReview.officer",
                    "name email role"
                )
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(currentLimit),

            LoanApplication.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(
            totalLoans / currentLimit
        );

        return res.status(200).json({
            message: "Admin loans fetched successfully",
            loans,
            pagination: {
                currentPage,
                limit: currentLimit,
                totalLoans,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            }
        });

    } catch (error) {
        next(error);
    }
};


const getAdminLoanDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const loanApplication = await LoanApplication.findById(id)
            .populate(
                "applicant",
                "name email role"
            )
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
            message: "Admin loan details fetched successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};


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

        const previousStatus = loanApplication.status;

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

        // Create audit trail entry
        await createAuditLog({
            loanApplication: loanApplication._id,
            changedBy: req.user._id,
            fromStatus: previousStatus,
            toStatus: loanApplication.status,
            reason: remarks.trim(),
            metadata: {
                decision
            }
        });

        // Generate EMI schedule only for approved loans
        if (decision === "APPROVED") {
            await generateEMISchedule(loanApplication);
        }

        return res.status(200).json({
            message: "Final admin decision submitted successfully",
            loanApplication
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    getAdminUsers,
    createAdminUser,
    updateAdminUser,
    getAdminLoans,
    getAdminLoanDetails,
    makeFinalDecision
};