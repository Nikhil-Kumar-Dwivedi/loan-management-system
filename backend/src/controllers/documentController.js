const Document = require("../models/Document");
const LoanApplication = require("../models/LoanApplication");

const uploadDocument = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check that the loan belongs to the logged-in applicant
        const loanApplication = await LoanApplication.findOne({
            _id: id,
            applicant: req.user._id
        });

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Only draft applications can receive normal document uploads
        if (loanApplication.status !== "DRAFT") {
            return res.status(400).json({
                message: "Documents can only be uploaded for draft applications"
            });
        }

        // Check whether a file was actually uploaded
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a document"
            });
        }

        const { documentType } = req.body;

        // Validate document type
        const allowedDocumentTypes = [
            "ID_PROOF",
            "INCOME_PROOF",
            "ADDITIONAL_DOCUMENT"
        ];

        if (!allowedDocumentTypes.includes(documentType)) {
            return res.status(400).json({
                message: "Invalid document type"
            });
        }

        // Save document metadata in MongoDB
        const document = await Document.create({
            loanApplication: loanApplication._id,
            uploadedBy: req.user._id,
            documentType,
            originalName: req.file.originalname,
            fileName: req.file.filename,
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            fileSize: req.file.size
        });

        return res.status(201).json({
            message: "Document uploaded successfully",
            document
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadDocument
};