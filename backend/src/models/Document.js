const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        loanApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LoanApplication",
            required: true,
            index: true
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        documentType: {
            type: String,
            enum: [
                "ID_PROOF",
                "INCOME_PROOF",
                "ADDITIONAL_DOCUMENT"
            ],
            required: true
        },

        originalName: {
            type: String,
            required: true,
            trim: true
        },

        fileName: {
            type: String,
            required: true,
            trim: true
        },

        filePath: {
            type: String,
            required: true
        },

        mimeType: {
            type: String,
            required: true,
            enum: [
                "application/pdf",
                "image/jpeg",
                "image/png"
            ]
        },

        fileSize: {
            type: Number,
            required: true,
            min: 1
        },

        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

documentSchema.index({
    loanApplication: 1,
    documentType: 1
});

module.exports = mongoose.model(
    "Document",
    documentSchema
);