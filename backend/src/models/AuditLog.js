const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        loanApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LoanApplication",
            required: true,
            index: true
        },

        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fromStatus: {
            type: String,
            enum: [
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "MORE_INFO_NEEDED",
                "OFFICER_RECOMMENDED_APPROVAL",
                "OFFICER_RECOMMENDED_REJECTION",
                "APPROVED",
                "REJECTED"
            ]
        },

        toStatus: {
            type: String,
            enum: [
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "MORE_INFO_NEEDED",
                "OFFICER_RECOMMENDED_APPROVAL",
                "OFFICER_RECOMMENDED_REJECTION",
                "APPROVED",
                "REJECTED"
            ],
            required: true
        },

        reason: {
            type: String,
            trim: true,
            maxlength: 1000
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    {
        timestamps: true
    }
);

// Helps retrieve the complete timeline of a loan
auditLogSchema.index({
    loanApplication: 1,
    createdAt: 1
});

module.exports = mongoose.model(
    "AuditLog",
    auditLogSchema
);