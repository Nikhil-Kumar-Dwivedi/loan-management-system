const fs = require("fs");
const path = require("path");

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

        // Documents can be uploaded for draft applications
        // and when an officer requests additional information
        const allowedStatuses = [
            "DRAFT",
            "MORE_INFO_NEEDED"
        ];

        if (!allowedStatuses.includes(loanApplication.status)) {
            return res.status(400).json({
                message: "Documents cannot be uploaded at this stage"
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
            document: {
                _id: document._id,
                documentType: document.documentType,
                originalName: document.originalName,
                fileName: document.fileName,
                mimeType: document.mimeType,
                fileSize: document.fileSize,
                uploadedAt: document.uploadedAt
            }
        });

    } catch (error) {
        next(error);
    }
};


const getLoanDocuments = async (req, res, next) => {
    try {
        const { id } = req.params;

        let loanApplication;

        // Applicant can only view documents of their own loan
        if (req.user.role === "APPLICANT") {
            loanApplication = await LoanApplication.findOne({
                _id: id,
                applicant: req.user._id
            });

            if (!loanApplication) {
                return res.status(404).json({
                    message: "Loan application not found"
                });
            }
        }

        // Loan Officer and Admin can view documents
        // for any loan application
        else if (
            req.user.role === "LOAN_OFFICER" ||
            req.user.role === "ADMIN"
        ) {
            loanApplication = await LoanApplication.findById(id);

            if (!loanApplication) {
                return res.status(404).json({
                    message: "Loan application not found"
                });
            }
        }

        else {
            return res.status(403).json({
                message: "You do not have permission to access these documents"
            });
        }

        const documents = await Document.find({
            loanApplication: id
        })
            .select(
                "_id loanApplication uploadedBy documentType originalName fileName mimeType fileSize uploadedAt"
            )
            .sort({
                uploadedAt: -1
            });

        return res.status(200).json({
            message: "Documents fetched successfully",
            documents
        });

    } catch (error) {
        next(error);
    }
};


const viewDocument = async (req, res, next) => {
    try {
        const { documentId } = req.params;

        // Find the document
        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        // Find the loan associated with this document
        const loanApplication = await LoanApplication.findById(
            document.loanApplication
        );

        if (!loanApplication) {
            return res.status(404).json({
                message: "Loan application not found"
            });
        }

        // Applicants can only view documents of their own loan
        if (
            req.user.role === "APPLICANT" &&
            loanApplication.applicant.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You do not have permission to view this document"
            });
        }

        // Only Applicant, Loan Officer and Admin are allowed
        if (
            req.user.role !== "APPLICANT" &&
            req.user.role !== "LOAN_OFFICER" &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                message: "You do not have permission to view this document"
            });
        }

        // Resolve the stored file path
        const filePath = path.resolve(document.filePath);

        // Check whether the file actually exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "Document file not found on server"
            });
        }

        // Set appropriate content type
        res.setHeader("Content-Type", document.mimeType);

        // Allow browser to display PDF/image instead of downloading
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${document.originalName}"`
        );

        // Send the actual file
        return res.sendFile(filePath);

    } catch (error) {
        next(error);
    }
};


module.exports = {
    uploadDocument,
    getLoanDocuments,
    viewDocument
};