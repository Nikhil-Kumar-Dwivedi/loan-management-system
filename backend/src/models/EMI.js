const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema(
    {
        loanApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LoanApplication",
            required: true,
            index: true
        },

        installmentNumber: {
            type: Number,
            required: true,
            min: 1
        },

        dueDate: {
            type: Date,
            required: true
        },

        principalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        interestAmount: {
            type: Number,
            required: true,
            min: 0
        },

        emiAmount: {
            type: Number,
            required: true,
            min: 0
        },

        remainingBalance: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["PENDING", "PAID", "OVERDUE"],
            default: "PENDING"
        },

        paidAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

emiSchema.index({
    loanApplication: 1,
    installmentNumber: 1
});

module.exports = mongoose.model("EMI", emiSchema);